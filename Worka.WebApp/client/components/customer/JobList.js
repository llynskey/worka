import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import notify, { confirmAction } from '../../Utils/notify';
import useAutoRefresh from '../../Utils/useAutoRefresh';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, formatDate, formatMoney, unwrap, getErrorMessage } from '../../api/workaApi';
import { useI18n } from '../../i18n/I18nContext';
import JobCard from './JobCard';
import AppFooter from '../AppFooter';
import Avatar from '../Avatar';
import Reveal from '../Reveal';
import Stars, { StarInput } from '../Stars';
import { colors, radius, shadow, space, embossDark, embossTitle, useLayout } from '../../Utils/theme';

const WORKA_SERVICE_FEE_RATE = 0.1;
const WORKA_SERVICE_FEE_MINIMUM = 2;

const getServiceFee = (price) => {
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.max(WORKA_SERVICE_FEE_MINIMUM, amount * WORKA_SERVICE_FEE_RATE);
};

const statusLabel = (status) => {
  if (status === 1 || String(status).toLowerCase() === 'accepted') return 'Booked';
  if (status === 2 || String(status).toLowerCase() === 'rejected') return 'Closed';
  if (status === 3 || String(status).toLowerCase() === 'completed') return 'Done';
  if (status === 4 || String(status).toLowerCase() === 'cancelled') return 'Closed';
  return 'Open';
};

const CustomerJobList = ({ navigation }) => {
  const { t } = useI18n();
  const { isDesktop, isPhone } = useLayout();
  // Desktop is a two-column dashboard (jobs grid + a right rail); phone/tablet
  // stack into a single column.
  const [scrollTick, setScrollTick] = useState(0);
  const [account, setAccount] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [checkoutMessage, setCheckoutMessage] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [editForm, setEditForm] = useState({ jobName: '', jobDescription: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [jobFilter, setJobFilter] = useState('active');
  const [reviewJob, setReviewJob] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [checkoutPreview, setCheckoutPreview] = useState(null);
  const [startingCheckout, setStartingCheckout] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout === 'success' || checkout === 'cancelled') {
      // Only the type is stored — title/text resolve through t() at render
      // time so the banner follows language switches.
      setCheckoutMessage({ type: checkout });
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setError(null);
    const accountResponse = await api.get('/api/Customer/account');
    const accountData = unwrap(accountResponse.data);
    setAccount(accountData);

    const [jobsResponse, quotesResponse] = await Promise.all([
      api.get('/CustomerJobs'),
      api.get('/CustomerQuotes'),
    ]);

    setJobs(unwrap(jobsResponse.data) ?? []);
    setQuotes(unwrap(quotesResponse.data) ?? []);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err, t('jobs.loadError')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadDashboard, t]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Keep the dashboard live: silently re-pull jobs/quotes so new quotes
  // and status changes show up without a manual reload.
  useAutoRefresh(loadDashboard);

  const jobsById = useMemo(() => {
    return jobs.reduce((acc, job) => {
      acc[job.jobId] = job;
      return acc;
    }, {});
  }, [jobs]);

  const recentActivity = useMemo(() => {
    return [...quotes]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4)
      .map((quote) => ({
        id: quote.quoteId,
        booked: jobsById[quote.jobId]?.acceptedQuoteId === quote.quoteId,
        price: quote.price,
        currency: jobsById[quote.jobId]?.currency,
        jobName: jobsById[quote.jobId]?.jobName ?? t('jobs.aJob'),
        when: formatDate(quote.createdAt),
      }));
  }, [jobsById, quotes, t]);

  const quotesByJob = useMemo(() => {
    return quotes.reduce((acc, quote) => {
      acc[quote.jobId] = acc[quote.jobId] || [];
      acc[quote.jobId].push(quote);
      return acc;
    }, {});
  }, [quotes]);

  const stats = useMemo(() => {
    const openJobs = jobs.filter((job) => statusLabel(job.jobStatus) === 'Open').length;
    const bookedJobs = jobs.filter((job) => statusLabel(job.jobStatus) === 'Booked').length;
    const completedJobs = jobs.filter((job) => statusLabel(job.jobStatus) === 'Done').length;
    const quoteTotal = quotes.length;

    return [
      { label: t('jobs.statOpen'), value: openJobs },
      { label: t('jobs.statQuotes'), value: quoteTotal },
      { label: t('jobs.statBooked'), value: bookedJobs },
      { label: t('jobs.statCompleted'), value: completedJobs },
    ];
  }, [jobs, quotes, t]);

  const activeJobs = useMemo(
    () => jobs.filter((job) => ['Open', 'Booked'].includes(statusLabel(job.jobStatus))),
    [jobs]
  );
  const pastJobs = useMemo(
    () => jobs.filter((job) => ['Done', 'Closed'].includes(statusLabel(job.jobStatus))),
    [jobs]
  );
  const visibleJobs = jobFilter === 'active' ? activeJobs : pastJobs;

  const acceptQuote = useCallback(
    async (job, quote) => {
      try {
        const origin =
          Platform.OS === 'web' && typeof window !== 'undefined'
            ? window.location.origin
            : 'https://fixa.site';

        const response = await api.post(`/payments/jobs/${job.jobId}/quotes/${quote.quoteId}/checkout`, {
          successUrl: `${origin}/?checkout=success`,
          cancelUrl: `${origin}/?checkout=cancelled`,
        });
        const checkout = unwrap(response.data);
        if (!checkout?.checkoutUrl) {
          setCheckoutPreview(null);
          notify(t('checkout.startErrorTitle'), t('checkout.noLink'));
          return;
        }

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = checkout.checkoutUrl;
          return;
        }

        setCheckoutPreview(null);
        await Linking.openURL(checkout.checkoutUrl);
      } catch (err) {
        // Close the checkout sheet first: on iOS a native Modal sits above
        // the toast layer, so an error shown behind it would be invisible.
        setCheckoutPreview(null);
        notify(t('checkout.startErrorTitle'), getErrorMessage(err, t('common.tryAgain')));
      }
    },
    [t]
  );

  const openReview = useCallback((job) => {
    setReviewForm({ rating: 5, comment: '' });
    setReviewJob(job);
  }, []);

  const submitReview = useCallback(async () => {
    if (!reviewJob) return;

    try {
      setSubmittingReview(true);
      await api.post(`/Jobs/${reviewJob.jobId}/review`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
      setReviewJob(null);
      notify(t('reviews.thanksTitle'), t('reviews.thanksText'));
    } catch (err) {
      notify(t('reviews.errorTitle'), getErrorMessage(err, t('common.tryAgain')));
    } finally {
      setSubmittingReview(false);
    }
  }, [reviewForm, reviewJob, t]);

  const openEditJob = useCallback((job) => {
    setEditForm({ jobName: job.jobName ?? '', jobDescription: job.jobDescription ?? '' });
    setEditJob(job);
  }, []);

  const saveJobEdit = useCallback(async () => {
    if (!editJob) return;
    if (!editForm.jobName.trim()) {
      notify(t('jobs.addTitleTitle'), t('jobs.addTitleText'));
      return;
    }

    try {
      setSavingEdit(true);
      await api.put(`/Jobs/${editJob.jobId}`, {
        jobName: editForm.jobName.trim(),
        jobDescription: editForm.jobDescription.trim(),
        category: editJob.category ?? '',
        address: editJob.address ?? '',
        locationLabel: editJob.locationLabel ?? '',
        photoUrl: editJob.photoUrl ?? '',
        currency: editJob.currency ?? 'gbp',
        latitude: editJob.latitude,
        longitude: editJob.longitude,
      });
      setEditJob(null);
      await refresh();
      notify(t('jobs.updatedTitle'), t('jobs.updatedText'));
    } catch (err) {
      notify(t('jobs.updateErrorTitle'), getErrorMessage(err, t('common.tryAgain')));
    } finally {
      setSavingEdit(false);
    }
  }, [editForm, editJob, refresh, t]);

  const deleteJob = useCallback(
    async (job) => {
      const confirmed = await confirmAction(
        t('jobs.deleteConfirmTitle'),
        t('jobs.deleteConfirmText', { name: job.jobName }),
        t('common.delete'),
        t('common.cancel')
      );
      if (!confirmed) return;

      try {
        await api.delete(`/Jobs/${job.jobId}`);
        await refresh();
        notify(t('jobs.deletedTitle'), t('jobs.deletedText'));
      } catch (err) {
        notify(t('jobs.deleteErrorTitle'), getErrorMessage(err, t('common.tryAgain')));
      }
    },
    [refresh, t]
  );

  const completeJob = useCallback(
    async (job) => {
      const confirmed = await confirmAction(
        t('jobs.completeConfirmTitle'),
        t('jobs.completeConfirmText'),
        t('jobs.markComplete'),
        t('common.cancel')
      );
      if (!confirmed) return;

      try {
        await api.post(`/Jobs/${job.jobId}/complete`);
        await refresh();
        notify(t('jobs.completedTitle'), t('jobs.completedText'));
      } catch (err) {
        notify(t('jobs.completeErrorTitle'), getErrorMessage(err, t('common.tryAgain')));
      }
    },
    [refresh, t]
  );

  const confirmSchedule = useCallback(
    async (job) => {
      try {
        await api.post(`/Jobs/${job.jobId}/schedule/confirm`);
        await refresh();
        notify(t('schedule.confirmedTitle'), t('schedule.confirmedText'));
      } catch (err) {
        notify(t('schedule.errorTitle'), getErrorMessage(err, t('common.tryAgain')));
      }
    },
    [refresh, t]
  );

  const cancelBooking = useCallback(
    async (job) => {
      const confirmed = await confirmAction(
        t('jobs.cancelConfirmTitle'),
        t('jobs.cancelConfirmText'),
        t('jobs.cancelBooking'),
        t('common.cancel')
      );
      if (!confirmed) return;

      try {
        await api.post(`/payments/jobs/${job.jobId}/cancel`);
        await refresh();
        notify(t('jobs.cancelledTitle'), t('jobs.cancelledText'));
      } catch (err) {
        notify(t('jobs.cancelErrorTitle'), getErrorMessage(err, t('common.tryAgain')));
      }
    },
    [refresh, t]
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
        <Text style={styles.mutedText}>{t('jobs.loadingWorkspace')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <MaterialCommunityIcons name="cloud-alert-outline" size={34} color="#111" />
        <Text style={styles.errorTitle}>{t('jobs.couldNotLoad')}</Text>
        <Text style={styles.mutedText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={refresh}>
          <Text style={styles.primaryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statIcons = ['clipboard-text-outline', 'file-document-outline', 'calendar-check-outline', 'check-decagram-outline'];

  const checkoutBannerEl = checkoutMessage ? (
    <View style={[styles.checkoutBanner, checkoutMessage.type === 'success' && styles.checkoutBannerSuccess]}>
      <MaterialCommunityIcons
        name={checkoutMessage.type === 'success' ? 'check-circle-outline' : 'alert-circle-outline'}
        size={22}
        color="#111"
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.checkoutBannerTitle}>
          {checkoutMessage.type === 'success' ? t('jobs.paymentReceivedTitle') : t('jobs.paymentCancelledTitle')}
        </Text>
        <Text style={styles.checkoutBannerText}>
          {checkoutMessage.type === 'success' ? t('jobs.paymentReceivedText') : t('jobs.paymentCancelledText')}
        </Text>
      </View>
      <TouchableOpacity style={styles.bannerClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setCheckoutMessage(null)}>
        <MaterialCommunityIcons name="close" size={18} color="#111" />
      </TouchableOpacity>
    </View>
  ) : null;

  const heroBanner = (
    <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
      <View style={styles.heroCopy}>
        <Text style={styles.eyebrow}>{t('jobs.customerEyebrow')}</Text>
        <Text style={styles.heroTitle}>
          {account ? t('jobs.greeting', { name: account.firstName }) : t('jobs.pipeline')}
        </Text>
        <Text style={styles.heroText}>{t('jobs.heroText')}</Text>
      </View>
      <TouchableOpacity style={styles.heroCta} onPress={() => navigation?.navigate('Post a Job')}>
        <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#111" />
        <Text style={styles.heroCtaText}>{t('jobs.postJob')}</Text>
      </TouchableOpacity>
    </View>
  );

  const statsCard = (
    <View style={styles.statsGrid}>
      {stats.map((stat, i) => (
        <View key={stat.label} style={styles.statCard}>
          <View style={styles.statIcon}>
            <MaterialCommunityIcons name={statIcons[i]} size={15} color={colors.ink} />
          </View>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );

  const activityEl =
    recentActivity.length > 0 ? (
      <View style={styles.activityCard}>
        <Text style={styles.activityTitle}>{t('jobs.recentActivity')}</Text>
        {recentActivity.map((entry) => (
          <View key={entry.id} style={styles.activityRow}>
            <View style={[styles.activityDot, entry.booked && styles.activityDotBooked]}>
              <MaterialCommunityIcons
                name={entry.booked ? 'check' : 'file-document-outline'}
                size={14}
                color={entry.booked ? colors.accent : colors.ink}
              />
            </View>
            <Text style={styles.activityText}>
              {entry.booked ? t('jobs.activityBooked') : t('jobs.activityQuote')}{' '}
              <Text style={styles.activityStrong}>{formatMoney(entry.price, entry.currency)}</Text>
              {` ${t('jobs.activityOn')} `}
              <Text style={styles.activityStrong}>{entry.jobName}</Text>
            </Text>
            <Text style={styles.activityWhen}>{entry.when}</Text>
          </View>
        ))}
      </View>
    ) : null;

  const quickActionsEl = (
    <View style={styles.railCard}>
      <Text style={styles.railTitle}>{t('jobs.quickActions')}</Text>
      <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate('Post a Job')}>
        <View style={styles.quickIcon}>
          <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.ink} />
        </View>
        <Text style={styles.quickText}>{t('jobs.postJob')}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedSoft} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate('Find Pros')}>
        <View style={styles.quickIcon}>
          <MaterialCommunityIcons name="account-search-outline" size={18} color={colors.ink} />
        </View>
        <Text style={styles.quickText}>{t('jobs.findAPro')}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedSoft} />
      </TouchableOpacity>
    </View>
  );

  const segmentRowEl = (
    <View style={styles.segmentRow}>
      <TouchableOpacity
        style={[styles.segment, jobFilter === 'active' && styles.segmentActive]}
        onPress={() => setJobFilter('active')}
      >
        <Text style={[styles.segmentText, jobFilter === 'active' && styles.segmentTextActive]}>
          {t('jobs.activeCount', { count: activeJobs.length })}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segment, jobFilter === 'past' && styles.segmentActive]}
        onPress={() => setJobFilter('past')}
      >
        <Text style={[styles.segmentText, jobFilter === 'past' && styles.segmentTextActive]}>
          {t('jobs.pastCount', { count: pastJobs.length })}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const emptyEl =
    jobFilter === 'past' ? (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="history" size={40} color="#111" />
        <Text style={styles.emptyTitle}>{t('jobs.noPastTitle')}</Text>
        <Text style={styles.mutedText}>{t('jobs.noPastText')}</Text>
      </View>
    ) : (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="clipboard-plus-outline" size={40} color="#111" />
        <Text style={styles.emptyTitle}>{t('jobs.noActiveTitle')}</Text>
        <Text style={styles.mutedText}>{t('jobs.noActiveText')}</Text>
        <TouchableOpacity
          style={[styles.primaryButton, styles.primaryButtonCentered]}
          onPress={() => navigation?.navigate('Post a Job')}
        >
          <Text style={styles.primaryButtonText}>{t('jobs.postJob')}</Text>
        </TouchableOpacity>
      </View>
    );

  const jobsGrid =
    visibleJobs.length === 0 ? (
      emptyEl
    ) : (
      <View style={styles.grid}>
        {visibleJobs.map((item, i) => (
          <Reveal key={item.jobId} tick={scrollTick} delay={Math.min(i, 8) * 55} style={[styles.gridCell, isPhone && styles.gridCellFull]}>
            <JobCard
              job={item}
              quotes={quotesByJob[item.jobId] ?? []}
              onAcceptQuote={(quote) => setCheckoutPreview({ job: item, quote })}
              onEditJob={openEditJob}
              onDeleteJob={deleteJob}
              onCompleteJob={completeJob}
              onReviewJob={openReview}
              onConfirmSchedule={confirmSchedule}
              onCancelBooking={cancelBooking}
            />
          </Reveal>
        ))}
      </View>
    );

  const jobsColumn = (
    <View style={styles.mainCol}>
      {segmentRowEl}
      <Text style={styles.sectionTitle}>{t('jobs.yourJobs')}</Text>
      {jobsGrid}
    </View>
  );

  return (
    <>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      onScroll={(event) => {
        const bucket = Math.round(event.nativeEvent.contentOffset.y / 60);
        setScrollTick((current) => (current === bucket ? current : bucket));
      }}
      scrollEventThrottle={80}
    >
      {checkoutBannerEl}
      <Reveal tick={scrollTick} delay={0}>{heroBanner}</Reveal>

      {isDesktop ? (
        <View style={styles.dashRow}>
          {jobsColumn}
          <View style={styles.rail}>
            {statsCard}
            {activityEl}
            {quickActionsEl}
          </View>
        </View>
      ) : (
        <View style={styles.dashCol}>
          {statsCard}
          {activityEl}
          {jobsColumn}
        </View>
      )}

      <AppFooter />
    </ScrollView>

    <Modal
      visible={!!checkoutPreview}
      transparent
      animationType="slide"
      onRequestClose={() => setCheckoutPreview(null)}
    >
      <View style={styles.editBackdrop}>
        <View style={styles.editCard}>
          {checkoutPreview ? (
            <>
              <View style={styles.editHeader}>
                <Text style={styles.editTitle}>{t('checkout.reviewPay')}</Text>
                <TouchableOpacity
                  style={styles.bannerClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => setCheckoutPreview(null)}
                >
                  <MaterialCommunityIcons name="close" size={18} color="#111" />
                </TouchableOpacity>
              </View>

              <Text style={styles.checkoutJobName} numberOfLines={2}>
                {checkoutPreview.job.jobName}
              </Text>

              <View style={styles.checkoutProRow}>
                <Avatar
                  photoUrl={checkoutPreview.quote.professionalPhotoUrl}
                  firstName={checkoutPreview.quote.professionalFirstName}
                  lastName={checkoutPreview.quote.professionalLastName}
                  size={40}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.checkoutProName} numberOfLines={1}>
                    {checkoutPreview.quote.professionalFirstName
                      ? `${checkoutPreview.quote.professionalFirstName} ${checkoutPreview.quote.professionalLastName ?? ''}`.trim()
                      : t('checkout.proFallback')}
                  </Text>
                  <Stars
                    value={checkoutPreview.quote.professionalRating}
                    count={checkoutPreview.quote.professionalReviewCount}
                    size={13}
                    emptyLabel={t('reviews.none')}
                  />
                </View>
              </View>

              <View style={styles.checkoutLines}>
                <View style={styles.checkoutLine}>
                  <Text style={styles.checkoutLineLabel}>{t('checkout.quote')}</Text>
                  <Text style={styles.checkoutLineValue}>
                    {formatMoney(checkoutPreview.quote.price, checkoutPreview.job.currency)}
                  </Text>
                </View>
                <View style={styles.checkoutLine}>
                  <Text style={styles.checkoutLineLabel}>{t('checkout.serviceFee')}</Text>
                  <Text style={styles.checkoutLineValue}>
                    {formatMoney(getServiceFee(checkoutPreview.quote.price), checkoutPreview.job.currency)}
                  </Text>
                </View>
                <View style={[styles.checkoutLine, styles.checkoutTotalLine]}>
                  <Text style={styles.checkoutTotalLabel}>{t('checkout.total')}</Text>
                  <Text style={styles.checkoutTotalValue}>
                    {formatMoney(
                      Number(checkoutPreview.quote.price) + getServiceFee(checkoutPreview.quote.price),
                      checkoutPreview.job.currency
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.checkoutSecureRow}>
                <MaterialCommunityIcons name="shield-check-outline" size={17} color="#24513b" />
                <Text style={styles.checkoutSecureText}>{t('checkout.secureLine')}</Text>
              </View>

              <TouchableOpacity
                style={styles.editSaveButton}
                disabled={startingCheckout}
                onPress={async () => {
                  try {
                    setStartingCheckout(true);
                    await acceptQuote(checkoutPreview.job, checkoutPreview.quote);
                  } finally {
                    setStartingCheckout(false);
                  }
                }}
              >
                {startingCheckout ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.editSaveText}>
                    {t('checkout.paySecurely', {
                      amount: formatMoney(
                        Number(checkoutPreview.quote.price) + getServiceFee(checkoutPreview.quote.price),
                        checkoutPreview.job.currency
                      ),
                    })}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </Modal>

    <Modal visible={!!editJob} transparent animationType="slide" onRequestClose={() => setEditJob(null)}>
      <View style={styles.editBackdrop}>
        <View style={styles.editCard}>
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>{t('jobs.editJob')}</Text>
            <TouchableOpacity
              style={styles.bannerClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setEditJob(null)}
            >
              <MaterialCommunityIcons name="close" size={18} color="#111" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.editInput}
            value={editForm.jobName}
            onChangeText={(jobName) => setEditForm((current) => ({ ...current, jobName }))}
            placeholder={t('jobs.titlePlaceholder')}
            placeholderTextColor="#686b64"
          />
          <TextInput
            style={[styles.editInput, styles.editTextArea]}
            value={editForm.jobDescription}
            onChangeText={(jobDescription) => setEditForm((current) => ({ ...current, jobDescription }))}
            placeholder={t('jobs.descPlaceholder')}
            placeholderTextColor="#686b64"
            multiline
          />

          <TouchableOpacity style={styles.editSaveButton} onPress={saveJobEdit} disabled={savingEdit}>
            {savingEdit ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.editSaveText}>{t('common.saveChanges')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    <Modal visible={!!reviewJob} transparent animationType="slide" onRequestClose={() => setReviewJob(null)}>
      <View style={styles.editBackdrop}>
        <View style={styles.editCard}>
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>{t('reviews.leave')}</Text>
            <TouchableOpacity
              style={styles.bannerClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setReviewJob(null)}
            >
              <MaterialCommunityIcons name="close" size={18} color="#111" />
            </TouchableOpacity>
          </View>

          <Text style={styles.reviewJobName}>{reviewJob?.jobName}</Text>

          <View style={styles.reviewStars}>
            <StarInput
              value={reviewForm.rating}
              onChange={(rating) => setReviewForm((current) => ({ ...current, rating }))}
            />
          </View>

          <TextInput
            style={[styles.editInput, styles.editTextArea]}
            value={reviewForm.comment}
            onChangeText={(comment) => setReviewForm((current) => ({ ...current, comment }))}
            placeholder={t('reviews.placeholder')}
            placeholderTextColor="#686b64"
            multiline
          />

          <TouchableOpacity style={styles.editSaveButton} onPress={submitReview} disabled={submittingReview}>
            {submittingReview ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.editSaveText}>{t('reviews.submit')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.paper,
  },
  content: {
    padding: space.lg,
    paddingBottom: 28,
    flexGrow: 1,
    backgroundColor: colors.paper,
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },
  dashRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.lg,
  },
  dashCol: {
    width: '100%',
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
  },
  rail: {
    width: 340,
    flexShrink: 0,
    gap: space.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: space.lg,
  },
  gridCell: {
    flexGrow: 1,
    flexBasis: 340,
    minWidth: 300,
    maxWidth: '100%',
  },
  gridCellFull: {
    flexBasis: '100%',
    minWidth: '100%',
  },
  hero: {
    backgroundColor: colors.hero,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: space.lg,
    ...shadow.card,
  },
  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.xl,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.accentOnDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroText: {
    color: colors.onHero,
    fontSize: 15,
    lineHeight: 21,
  },
  heroCta: {
    marginTop: 16,
    alignSelf: 'flex-start',
    minHeight: 48,
    backgroundColor: '#fff',
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...(shadow.card),
  },
  heroCtaText: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...(embossDark || {}),
  },
  primaryButtonCentered: {
    alignSelf: 'center',
    marginTop: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: space.lg,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 140,
    minHeight: 92,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
  },
  statLabel: {
    marginTop: 4,
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13,
  },
  railCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    ...shadow.card,
  },
  railTitle: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 10,
  },
  quickAction: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontWeight: '800',
    fontSize: 14,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 14,
    marginBottom: 18,
  },
  activityTitle: {
    color: '#111',
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 10,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#f1ede4',
  },
  activityDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1ede4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDotBooked: {
    backgroundColor: '#dff4e8',
  },
  activityText: {
    flex: 1,
    minWidth: 0,
    color: '#4d504b',
    lineHeight: 19,
  },
  activityStrong: {
    color: '#111',
    fontWeight: '800',
  },
  activityWhen: {
    color: '#8a8d84',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#111',
  },
  segmentText: {
    color: '#111',
    fontWeight: '900',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#fff',
  },
  reviewJobName: {
    color: '#62645c',
    fontWeight: '700',
    marginBottom: 12,
  },
  reviewStars: {
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  checkoutBanner: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    padding: 13,
    marginBottom: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkoutBannerSuccess: {
    backgroundColor: '#e8f5ed',
  },
  checkoutBannerTitle: {
    color: '#111',
    fontWeight: '900',
  },
  checkoutBannerText: {
    color: '#4d504b',
    lineHeight: 20,
    marginTop: 3,
  },
  bannerClose: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  centerState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f5ef',
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
  errorTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },
  checkoutJobName: {
    color: '#111',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  checkoutProRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fbfaf6',
    marginBottom: 14,
  },
  checkoutProName: {
    color: '#111',
    fontWeight: '900',
    fontSize: 14,
  },
  checkoutLines: {
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  checkoutLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  checkoutLineLabel: {
    color: '#62645c',
    fontWeight: '700',
  },
  checkoutLineValue: {
    color: '#111',
    fontWeight: '800',
  },
  checkoutTotalLine: {
    borderTopWidth: 1,
    borderTopColor: '#ece7dc',
    marginTop: 6,
    paddingTop: 10,
  },
  checkoutTotalLabel: {
    color: '#111',
    fontWeight: '900',
    fontSize: 16,
  },
  checkoutTotalValue: {
    color: '#111',
    fontWeight: '900',
    fontSize: 18,
  },
  checkoutSecureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  checkoutSecureText: {
    flex: 1,
    color: '#24513b',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    padding: 20,
  },
  editCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 18,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  editTitle: {
    color: '#111',
    fontSize: 20,
    fontWeight: '900',
  },
  editInput: {
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
  editTextArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  editSaveButton: {
    minHeight: 48,
    backgroundColor: '#111',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSaveText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  mutedText: {
    color: '#63665f',
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CustomerJobList;
