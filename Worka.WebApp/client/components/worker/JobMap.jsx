import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import notify from '../../Utils/notify';
import useAutoRefresh from '../../Utils/useAutoRefresh';
import { api, formatDate, getErrorMessage, resolveUploadUrl, unwrap } from '../../api/workaApi';
import { formatDistance, getDistanceKm, hasCoordinates, requestCurrentLocation } from '../../Utils/locationUtils';
import { useDistanceUnit, milesToKm } from '../../Utils/distanceUnit';
import { useI18n } from '../../i18n/I18nContext';
import { categoryLabel } from '../../i18n/categories';
import AppFooter from '../AppFooter';
import JobsMapView from '../JobsMapView';
import JobDetailsModal from './JobDetailsModal';

const getLocationLabel = (job, fallback = 'Location not set') => job.locationLabel || job.address || fallback;

const categoryImages = {
  plumbing: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80',
  electrical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80',
  painting: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80',
  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
  garden: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
  repairs: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
};

const jobImage = (job) =>
  (job && resolveUploadUrl(job.photoUrl)) ||
  categoryImages[String(job?.category ?? '').toLowerCase()] ||
  categoryImages.repairs;

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

const getMapUrl = (job) => {
  const latitude = Number(job.latitude);
  const longitude = Number(job.longitude);

  if (MAPBOX_TOKEN) {
    // Interactive Mapbox GL embed — crisp vector tiles that match the brand
    // far better than the raster OSM fallback below.
    return (
      `https://api.mapbox.com/styles/v1/mapbox/light-v11.html` +
      `?title=false&zoomwheel=true&access_token=${encodeURIComponent(MAPBOX_TOKEN)}` +
      `#13.2/${latitude}/${longitude}`
    );
  }

  const latPadding = 0.025;
  const lngPadding = 0.04;
  const bbox = [
    longitude - lngPadding,
    latitude - latPadding,
    longitude + lngPadding,
    latitude + latPadding,
  ].join(',');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
};

const openExternalMap = (job, currentLocation) => {
  const latitude = Number(job.latitude);
  const longitude = Number(job.longitude);
  const url = currentLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  Linking.openURL(url);
};

const JobMap = () => {
  const { t } = useI18n();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [workLocation, setWorkLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [account, setAccount] = useState(null);
  const [detailsJob, setDetailsJob] = useState(null);
  const [quoteJob, setQuoteJob] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ price: '', description: '' });
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [distanceOpen, setDistanceOpen] = useState(true);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isNarrow = windowWidth < 700;
  const mapHeight = Math.min(300, Math.round(windowHeight * 0.45));

  const unit = useDistanceUnit();
  // Discrete distance presets that step up to National and Everywhere (no cap),
  // so a spread-out marketplace is never empty at the top of the range.
  const RADIUS_PRESETS = unit === 'mi' ? [5, 10, 25, 50, 100, 300, Infinity] : [10, 25, 50, 100, 200, 500, Infinity];
  const nationalValue = unit === 'mi' ? 300 : 500;
  const [radius, setRadius] = useState(unit === 'mi' ? 50 : 80);
  // Reset to a sensible default whenever the unit preference changes.
  useEffect(() => {
    setRadius(unit === 'mi' ? 50 : 80);
  }, [unit]);
  const radiusKm = radius === Infinity ? Infinity : unit === 'mi' ? milesToKm(radius) : radius;
  const presetLabel = (v) =>
    v === Infinity ? t('map.everywhere') : v === nationalValue ? t('map.national') : `${v} ${unit}`;

  // The worker's saved work location takes priority as the distance origin;
  // the device location is the fallback when no work location is set.
  const origin = workLocation ?? currentLocation;

  const loadJobs = useCallback(async () => {
    setError(null);
    const response = await api.get('/Jobs');
    const nextJobs = unwrap(response.data) ?? [];
    const openJobs = nextJobs.filter((job) => !job.acceptedQuoteId);
    setJobs(openJobs);

    setSelectedJobId((current) => {
      if (current && openJobs.some((job) => job.jobId === current && hasCoordinates(job))) {
        return current;
      }

      return openJobs.find(hasCoordinates)?.jobId ?? null;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadJobs();
    } catch (err) {
      setError(getErrorMessage(err, t('map.loadError')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadJobs, t]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Open jobs stay current without a manual reload.
  useAutoRefresh(loadJobs, 30000);

  // Ask for location automatically; the manual button only appears if the
  // silent attempt fails (e.g. permission not yet granted).
  useEffect(() => {
    requestCurrentLocation().then(setCurrentLocation).catch(() => {});
  }, []);

  // Selecting a job (e.g. by tapping its map pin) scrolls the list so that job
  // sits at the top of the visible list. scrollIntoView handles the nesting.
  useEffect(() => {
    if (Platform.OS !== 'web' || !selectedJobId || typeof document === 'undefined') return;
    const el = document.getElementById(`jobmap-item-${selectedJobId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedJobId]);

  // Load the saved work location so distances default to the worker's base.
  useEffect(() => {
    api
      .get('/api/Professionals/account')
      .then((response) => {
        const acc = unwrap(response.data);
        setAccount(acc);
        if (acc && hasCoordinates(acc)) {
          setWorkLocation({
            latitude: Number(acc.latitude),
            longitude: Number(acc.longitude),
            label: acc.locationLabel || '',
          });
        }
      })
      .catch(() => {});
  }, []);

  const locatedJobs = useMemo(() => {
    const nextJobs = jobs.filter(hasCoordinates);
    if (!origin) return nextJobs;

    return [...nextJobs].sort((a, b) => {
      const aDistance = getDistanceKm(origin, a) ?? Number.MAX_SAFE_INTEGER;
      const bDistance = getDistanceKm(origin, b) ?? Number.MAX_SAFE_INTEGER;
      return aDistance - bDistance;
    });
  }, [origin, jobs]);
  const unlocatedJobs = useMemo(() => jobs.filter((job) => !hasCoordinates(job)), [jobs]);

  // With an origin we can filter to a radius; without one, show all located jobs.
  const shownJobs = useMemo(() => {
    if (!origin || radiusKm === Infinity) return locatedJobs;
    return locatedJobs.filter((job) => {
      const distance = getDistanceKm(origin, job);
      return distance != null && distance <= radiusKm;
    });
  }, [origin, locatedJobs, radiusKm]);

  // Jobs inside the slider radius — shared by the list and the map so pins,
  // the radius circle and the list all move together with the slider.
  const inRadiusIds = useMemo(() => new Set(shownJobs.map((job) => job.jobId)), [shownJobs]);

  const selectedJob = shownJobs.find((job) => job.jobId === selectedJobId) ?? shownJobs[0] ?? null;

  const useCurrentLocation = async () => {
    try {
      setLocating(true);
      setLocationError('');
      const location = await requestCurrentLocation();
      setCurrentLocation(location);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : t('map.locationFailed'));
    } finally {
      setLocating(false);
    }
  };

  const openJobDetails = useCallback(
    (jobId) => {
      const job = jobs.find((j) => j.jobId === jobId);
      if (job) {
        setSelectedJobId(jobId);
        setDetailsJob(job);
      }
    },
    [jobs]
  );

  // First tap selects (highlights on the map + list); tapping the already-selected
  // job opens its details.
  const handleSelectJob = useCallback(
    (jobId) => {
      if (selectedJobId === jobId) openJobDetails(jobId);
      else setSelectedJobId(jobId);
    },
    [selectedJobId, openJobDetails]
  );

  const openQuote = useCallback(
    (job) => {
      setQuoteForm({ price: '', description: t('quotes.defaultNote') });
      setQuoteJob(job);
    },
    [t]
  );

  const submitQuote = useCallback(async () => {
    const amount = Number(quoteForm.price);
    if (!quoteJob) return;
    if (!Number.isFinite(amount) || amount <= 0) {
      notify(t('quotes.addPriceTitle'), t('quotes.addPriceText'));
      return;
    }
    if (!quoteForm.description.trim()) {
      notify(t('quotes.addNoteTitle'), t('quotes.addNoteText'));
      return;
    }
    try {
      setSubmittingQuote(true);
      await api.post('/createQuote', { jobId: quoteJob.jobId, price: amount, description: quoteForm.description.trim() });
      setQuoteJob(null);
      await refresh();
      notify(t('quotes.sentTitle'), t('quotes.sentText'));
    } catch (err) {
      notify(t('quotes.sendErrorTitle'), getErrorMessage(err, t('common.tryAgain')));
    } finally {
      setSubmittingQuote(false);
    }
  }, [quoteForm, quoteJob, refresh, t]);

  const modals = (
    <>
      <JobDetailsModal
        job={detailsJob}
        image={detailsJob ? jobImage(detailsJob) : null}
        userLocation={currentLocation}
        professionalId={account?.professionalId}
        onClose={() => setDetailsJob(null)}
        onQuote={(job) => {
          setDetailsJob(null);
          openQuote(job);
        }}
      />
      <Modal visible={!!quoteJob} transparent animationType="slide" onRequestClose={() => setQuoteJob(null)}>
        <View style={styles.quoteBackdrop}>
          <View style={styles.quoteCard}>
            <View style={styles.quoteHeader}>
              <Text style={styles.quoteTitle}>{t('quotes.send')}</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={() => setQuoteJob(null)}>
                <MaterialCommunityIcons name="close" size={20} color="#111" />
              </TouchableOpacity>
            </View>
            <Text style={styles.quoteJobName} numberOfLines={2}>{quoteJob?.jobName}</Text>
            <TextInput
              style={styles.quoteInput}
              value={quoteForm.price}
              onChangeText={(price) => setQuoteForm((c) => ({ ...c, price }))}
              placeholder={t('quotes.pricePlaceholder', { currency: (quoteJob?.currency || 'gbp').toUpperCase() })}
              placeholderTextColor="#686b64"
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.quoteInput, styles.quoteTextArea]}
              value={quoteForm.description}
              onChangeText={(description) => setQuoteForm((c) => ({ ...c, description }))}
              placeholder={t('quotes.includedPlaceholder')}
              placeholderTextColor="#686b64"
              multiline
            />
            <TouchableOpacity style={styles.quoteSubmit} onPress={submitQuote} disabled={submittingQuote}>
              {submittingQuote ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.quoteSubmitText}>{t('quotes.send')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
        <Text style={styles.mutedText}>{t('map.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <MaterialCommunityIcons name="map-alert-outline" size={34} color="#111" />
        <Text style={styles.errorTitle}>{t('map.couldNotLoad')}</Text>
        <Text style={styles.mutedText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={refresh}>
          <Text style={styles.primaryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerBlock = (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>
          {t('map.eyebrow')} · {locatedJobs.length}
        </Text>
        <Text style={styles.title} numberOfLines={1}>{t('map.title')}</Text>
      </View>
      <TouchableOpacity style={styles.refreshButton} onPress={refresh} disabled={refreshing}>
        {refreshing ? (
          <ActivityIndicator color="#111" />
        ) : (
          <MaterialCommunityIcons name="refresh" size={20} color="#111" />
        )}
      </TouchableOpacity>
    </View>
  );

  const locationBarBlock = (
    <View style={[styles.locationBar, isNarrow && styles.locationBarNarrow]}>
      <View style={isNarrow ? styles.locationBarCopyNarrow : styles.locationBarCopy}>
        <Text style={styles.locationBarTitle}>
          {origin ? t('map.locationSetTitle') : t('map.locationNotSetTitle')}
        </Text>
        <Text style={styles.locationBarText}>
          {workLocation
            ? (workLocation.label || t('map.locationSetText'))
            : currentLocation
              ? t('map.locationSetText')
              : t('map.setWorkLocationHint')}
        </Text>
        {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
      </View>
      {workLocation || currentLocation ? null : (
        <TouchableOpacity
          style={[styles.locationButton, isNarrow && styles.locationButtonFull]}
          onPress={useCurrentLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color="#111" />
          ) : (
            <>
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#111" />
              <Text style={styles.locationButtonText}>{t('map.useLocation')}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const radiusText = presetLabel(radius);

  const radiusCard = (
    <View style={styles.filterCard}>
      <TouchableOpacity style={styles.filterHeader} activeOpacity={0.7} onPress={() => setDistanceOpen((v) => !v)}>
        <Text style={styles.filterLabel}>
          {t('map.distance')}
          {distanceOpen ? '' : ` · ${radiusText}`}
        </Text>
        <View style={styles.filterHeaderRight}>
          <Text style={styles.filterCount}>{shownJobs.length}</Text>
          <MaterialCommunityIcons name={distanceOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#111" />
        </View>
      </TouchableOpacity>
      {distanceOpen ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {RADIUS_PRESETS.map((v) => (
            <TouchableOpacity
              key={String(v)}
              style={[styles.preset, radius === v && styles.presetActive]}
              onPress={() => setRadius(v)}
            >
              <Text style={[styles.presetText, radius === v && styles.presetTextActive]}>{presetLabel(v)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  // Smoothly reveal the distance section once a location is found (web animates
  // the collapse/expand; native just shows it when there's an origin).
  const radiusBlock =
    Platform.OS === 'web'
      ? React.createElement(
          'div',
          {
            style: {
              overflow: 'hidden',
              transition: 'max-height 320ms ease, opacity 320ms ease',
              maxHeight: origin ? 260 : 0,
              opacity: origin ? 1 : 0,
            },
          },
          radiusCard
        )
      : origin
        ? radiusCard
        : null;

  const listBody = (
    <>
      {shownJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="map-marker-plus-outline" size={36} color="#111" />
          <Text style={styles.emptyTitle}>{t('map.emptyTitle')}</Text>
          <Text style={styles.mutedText}>
            {origin && locatedJobs.length > 0
              ? t('map.noneInRadius', { distance: radiusText })
              : t('map.emptyText')}
          </Text>
        </View>
      ) : (
        shownJobs.map((job) => {
          const active = selectedJob?.jobId === job.jobId;
          const distanceLabel = formatDistance(getDistanceKm(origin, job), unit);
          return (
            <TouchableOpacity
              key={job.jobId}
              nativeID={`jobmap-item-${job.jobId}`}
              style={[styles.jobItem, active && styles.jobItemActive]}
              onPress={() => handleSelectJob(job.jobId)}
            >
              <View style={styles.jobItemHeader}>
                <Text style={[styles.jobTitle, active && styles.jobTitleActive]}>{job.jobName}</Text>
                <Text style={[styles.jobMeta, active && styles.jobMetaActive]}>
                  {distanceLabel || formatDate(job.createdAt)}
                </Text>
              </View>
              <Text style={[styles.jobLocation, active && styles.jobLocationActive]}>
                {getLocationLabel(job, t('map.notSet'))}
              </Text>
              <View style={styles.jobFooter}>
                <Text style={[styles.jobCategory, active && styles.jobCategoryActive]}>
                  {categoryLabel(t, job.category)}
                </Text>
                <TouchableOpacity style={styles.openMapButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => openExternalMap(job, currentLocation)}>
                  <MaterialCommunityIcons name="open-in-new" size={15} color={active ? '#fff' : '#111'} />
                  <Text style={[styles.openMapText, active && styles.openMapTextActive]}>
                    {currentLocation ? t('map.directions') : t('map.open')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {unlocatedJobs.length > 0 ? (
        <View style={styles.unlocatedBlock}>
          <Text style={styles.unlocatedTitle}>{t('map.missingCoords')}</Text>
          {unlocatedJobs.map((job) => (
            <Text key={job.jobId} style={styles.unlocatedText}>
              {job.jobName} - {job.address || t('map.noAddress')}
            </Text>
          ))}
        </View>
      ) : null}
    </>
  );

  if (isNarrow) {
    return (
      <>
        <ScrollView style={styles.narrowShell} contentContainerStyle={styles.narrowContent}>
          {headerBlock}
          {radiusBlock}
          <View style={[styles.mapPaneNarrow, { height: mapHeight }]}>
            <JobsMapView
              jobs={locatedJobs}
              selectedJobId={selectedJobId}
              onSelectJob={handleSelectJob}
              onLocate={useCurrentLocation}
              userLocation={currentLocation}
              origin={origin}
              radiusKm={Number.isFinite(radiusKm) ? radiusKm : null}
              inRadiusIds={inRadiusIds}
            />
          </View>
          <View style={styles.narrowList}>{listBody}</View>
          <AppFooter />
        </ScrollView>
        {modals}
      </>
    );
  }

  return (
    <>
      <View style={styles.shell}>
        {headerBlock}
        {radiusBlock}

        <View style={styles.mapLayout}>
          <View style={styles.mapPane}>
            <JobsMapView
              jobs={locatedJobs}
              selectedJobId={selectedJobId}
              onSelectJob={handleSelectJob}
              onLocate={useCurrentLocation}
              userLocation={currentLocation}
              origin={origin}
              radiusKm={Number.isFinite(radiusKm) ? radiusKm : null}
              inRadiusIds={inRadiusIds}
            />
          </View>

          <ScrollView style={styles.listPane} contentContainerStyle={styles.listContent}>
            {listBody}
            <AppFooter />
          </ScrollView>
        </View>
      </View>
      {modals}
    </>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#f7f5ef',
    padding: 16,
  },
  narrowShell: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#f7f5ef',
  },
  narrowTop: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  narrowListScroll: {
    flex: 1,
    minHeight: 0,
  },
  narrowListContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 10,
  },
  narrowContent: {
    padding: 16,
    paddingBottom: 28,
    flexGrow: 1,
    width: '100%',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  mapPaneNarrow: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#111',
    marginBottom: 14,
  },
  narrowList: {
    width: '100%',
    gap: 10,
  },
  header: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  locationBar: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationBarNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  locationBarCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationBarCopyNarrow: {
    width: '100%',
  },
  locationButtonFull: {
    alignSelf: 'stretch',
  },
  filterCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    marginBottom: 14,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 4,
  },
  filterHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    color: '#111',
    fontWeight: '900',
    fontSize: 15,
  },
  filterCount: {
    minWidth: 26,
    textAlign: 'center',
    color: '#fff',
    backgroundColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontWeight: '900',
    fontSize: 13,
    overflow: 'hidden',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    paddingRight: 4,
  },
  preset: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 999,
    paddingHorizontal: 13,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  presetActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  presetText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
  },
  presetTextActive: {
    color: '#fff',
  },
  locationBarTitle: {
    color: '#111',
    fontWeight: '900',
  },
  locationBarText: {
    color: '#62645c',
    lineHeight: 20,
    marginTop: 3,
  },
  locationButton: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  locationButtonText: {
    color: '#111',
    fontWeight: '900',
  },
  locationError: {
    color: '#111',
    fontWeight: '800',
    marginTop: 5,
  },
  eyebrow: {
    color: '#62645c',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: '#111',
    fontSize: 19,
    fontWeight: '900',
  },
  titleNarrow: {
    fontSize: 18,
  },
  quoteBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    padding: 20,
  },
  quoteCard: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 18,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quoteTitle: {
    color: '#111',
    fontSize: 20,
    fontWeight: '900',
  },
  quoteJobName: {
    color: '#62645c',
    fontWeight: '700',
    marginBottom: 12,
  },
  quoteInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#fbfaf6',
    fontSize: 16,
  },
  quoteTextArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  quoteSubmit: {
    minHeight: 48,
    backgroundColor: '#111',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteSubmitText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  subtitle: {
    color: '#62645c',
    lineHeight: 20,
    marginTop: 4,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  mapLayout: {
    flex: 1,
    minHeight: 0,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 14,
  },
  mapPane: {
    flex: 1.25,
    minHeight: 0,
    minWidth: 0,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#111',
  },
  listPane: {
    flex: 0.8,
    minHeight: 0,
    minWidth: 0,
  },
  listContent: {
    gap: 10,
    paddingBottom: 36,
  },
  mapPlaceholder: {
    flex: 1,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  // Fill mode (desktop): grow to the pane instead of forcing a 420px floor,
  // so the map row can shrink to fit the viewport without overflowing.
  mapPlaceholderFill: {
    flex: 1,
    minHeight: 0,
  },
  placeholderTitle: {
    color: '#111',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 10,
  },
  placeholderText: {
    color: '#62645c',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },
  jobItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 13,
  },
  jobItemActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  jobItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  jobTitle: {
    flex: 1,
    color: '#111',
    fontSize: 16,
    fontWeight: '900',
  },
  jobTitleActive: {
    color: '#fff',
  },
  jobMeta: {
    color: '#62645c',
    fontWeight: '800',
    fontSize: 12,
  },
  jobMetaActive: {
    color: '#dcdcdc',
  },
  jobLocation: {
    color: '#4d504b',
    lineHeight: 20,
    marginTop: 8,
  },
  jobLocationActive: {
    color: '#f1f1f1',
  },
  jobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 6,
    marginTop: 10,
  },
  jobCategory: {
    flexShrink: 1,
    color: '#111',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  jobCategoryActive: {
    color: '#fff',
  },
  openMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
  },
  openMapText: {
    color: '#111',
    fontWeight: '900',
    fontSize: 12,
  },
  openMapTextActive: {
    color: '#fff',
  },
  unlocatedBlock: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 13,
  },
  unlocatedTitle: {
    color: '#111',
    fontWeight: '900',
    marginBottom: 8,
  },
  unlocatedText: {
    color: '#62645c',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e3dfd2',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },
  centerState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f5ef',
  },
  errorTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },
  mutedText: {
    color: '#63665f',
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignSelf: 'center',
    marginTop: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
});

export default JobMap;
