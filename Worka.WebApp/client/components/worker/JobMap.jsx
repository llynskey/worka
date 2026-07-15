import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAutoRefresh from '../../Utils/useAutoRefresh';
import { api, formatDate, getErrorMessage, unwrap } from '../../api/workaApi';
import { formatDistance, getDistanceKm, requestCurrentLocation } from '../../Utils/locationUtils';
import { useI18n } from '../../i18n/I18nContext';
import { categoryLabel } from '../../i18n/categories';
import AppFooter from '../AppFooter';
import MapPreview from '../MapPreview';

const hasCoordinates = (job) => Number.isFinite(Number(job.latitude)) && Number.isFinite(Number(job.longitude));

const getLocationLabel = (job, fallback = 'Location not set') => job.locationLabel || job.address || fallback;

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

const WebMapFrame = ({ job, minHeight = 420, userLocation = null }) => {
  const { t } = useI18n();

  if (!job || !hasCoordinates(job)) {
    return (
      <View style={[styles.mapPlaceholder, { minHeight }]}>
        <MaterialCommunityIcons name="map-marker-off-outline" size={36} color="#111" />
        <Text style={styles.placeholderTitle}>{t('map.chooseLocatedJob')}</Text>
        <Text style={styles.placeholderText}>{t('map.placeholderText')}</Text>
      </View>
    );
  }

  // MapPreview renders the branded static map with a pin on the job and,
  // when set, a second pin on the worker's current location plus distance.
  // (The interactive Mapbox embed cannot draw markers, which made the map
  // ambiguous — pins beat panning here.)
  return (
    <MapPreview
      latitude={job.latitude}
      longitude={job.longitude}
      userLocation={userLocation}
      locationLabel={getLocationLabel(job, t('map.notSet'))}
      height={Math.max(minHeight - 56, 180)}
    />
  );
};

const JobMap = () => {
  const { t } = useI18n();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isNarrow = windowWidth < 700;
  const mapHeight = Math.min(300, Math.round(windowHeight * 0.45));

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

  const locatedJobs = useMemo(() => {
    const nextJobs = jobs.filter(hasCoordinates);
    if (!currentLocation) return nextJobs;

    return [...nextJobs].sort((a, b) => {
      const aDistance = getDistanceKm(currentLocation, a) ?? Number.MAX_SAFE_INTEGER;
      const bDistance = getDistanceKm(currentLocation, b) ?? Number.MAX_SAFE_INTEGER;
      return aDistance - bDistance;
    });
  }, [currentLocation, jobs]);
  const unlocatedJobs = useMemo(() => jobs.filter((job) => !hasCoordinates(job)), [jobs]);
  const selectedJob = locatedJobs.find((job) => job.jobId === selectedJobId) ?? locatedJobs[0] ?? null;

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
        <Text style={styles.eyebrow}>{t('map.eyebrow')}</Text>
        <Text style={styles.title}>{t('map.title')}</Text>
        <Text style={styles.subtitle}>
          {t('map.subtitle', { located: locatedJobs.length, unlocated: unlocatedJobs.length })}
        </Text>
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
    <View style={styles.locationBar}>
      <View style={{ flex: 1 }}>
        <Text style={styles.locationBarTitle}>
          {currentLocation ? t('map.locationSetTitle') : t('map.locationNotSetTitle')}
        </Text>
        <Text style={styles.locationBarText}>
          {currentLocation ? t('map.locationSetText') : t('map.locationNotSetText')}
        </Text>
        {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
      </View>
      {currentLocation ? null : (
        <TouchableOpacity style={styles.locationButton} onPress={useCurrentLocation} disabled={locating}>
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

  const listBody = (
    <>
      {locatedJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="map-marker-plus-outline" size={36} color="#111" />
          <Text style={styles.emptyTitle}>{t('map.emptyTitle')}</Text>
          <Text style={styles.mutedText}>{t('map.emptyText')}</Text>
        </View>
      ) : (
        locatedJobs.map((job) => {
          const active = selectedJob?.jobId === job.jobId;
          const distanceLabel = formatDistance(getDistanceKm(currentLocation, job));
          return (
            <TouchableOpacity
              key={job.jobId}
              style={[styles.jobItem, active && styles.jobItemActive]}
              onPress={() => setSelectedJobId(job.jobId)}
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
      <ScrollView style={styles.narrowShell} contentContainerStyle={styles.narrowContent}>
        {headerBlock}
        {locationBarBlock}
        <View style={[styles.mapPaneNarrow, { height: mapHeight }]}>
          <WebMapFrame job={selectedJob} minHeight={mapHeight} userLocation={currentLocation} />
        </View>
        <View style={styles.narrowList}>{listBody}</View>
        <AppFooter />
      </ScrollView>
    );
  }

  return (
    <View style={styles.shell}>
      {headerBlock}
      {locationBarBlock}

      <View style={styles.mapLayout}>
        <View style={styles.mapPane}>
          <WebMapFrame job={selectedJob} userLocation={currentLocation} />
        </View>

        <ScrollView style={styles.listPane} contentContainerStyle={styles.listContent}>
          {listBody}
          <AppFooter />
        </ScrollView>
      </View>
    </View>
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
  narrowContent: {
    padding: 16,
    paddingBottom: 96,
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
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
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
    fontSize: 24,
    fontWeight: '900',
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
    minHeight: 320,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#111',
  },
  listPane: {
    flex: 0.8,
    minHeight: 0,
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
    gap: 10,
    marginTop: 10,
  },
  jobCategory: {
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
