import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import notify, { confirmAction } from '../../Utils/notify';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, formatDate, formatMoney, unwrap, getErrorMessage } from '../../api/workaApi';
import JobCard from './JobCard';
import { StarInput } from '../Stars';

const statusLabel = (status) => {
  if (status === 1 || String(status).toLowerCase() === 'accepted') return 'Booked';
  if (status === 2 || String(status).toLowerCase() === 'rejected') return 'Closed';
  if (status === 3 || String(status).toLowerCase() === 'completed') return 'Done';
  if (status === 4 || String(status).toLowerCase() === 'cancelled') return 'Closed';
  return 'Open';
};

const CustomerJobList = ({ navigation }) => {
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

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout === 'success') {
      setCheckoutMessage({
        type: 'success',
        title: 'Payment received',
        text: 'Your booking is being confirmed. Pull to refresh if the job has not updated yet.',
      });
      window.history.replaceState(null, '', window.location.pathname);
    }

    if (checkout === 'cancelled') {
      setCheckoutMessage({
        type: 'cancelled',
        title: 'Payment cancelled',
        text: 'No money was taken. You can choose the quote again when you are ready.',
      });
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
      setError(getErrorMessage(err, 'Unable to load your jobs.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

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
        jobName: jobsById[quote.jobId]?.jobName ?? 'a job',
        when: formatDate(quote.createdAt),
      }));
  }, [jobsById, quotes]);

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
    const quoteTotal = quotes.length;
    const bestQuote = quotes.reduce((best, quote) => {
      if (!best || Number(quote.price) < Number(best.price)) return quote;
      return best;
    }, null);

    return [
      { label: 'Open jobs', value: openJobs },
      { label: 'Quotes', value: quoteTotal },
      { label: 'Booked', value: bookedJobs },
      { label: 'Best quote', value: bestQuote ? formatMoney(bestQuote.price) : '-' },
    ];
  }, [jobs, quotes]);

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
            : 'https://worka.site';

        const response = await api.post(`/payments/jobs/${job.jobId}/quotes/${quote.quoteId}/checkout`, {
          successUrl: `${origin}/?checkout=success`,
          cancelUrl: `${origin}/?checkout=cancelled`,
        });
        const checkout = unwrap(response.data);
        if (!checkout?.checkoutUrl) {
          notify('Could not start payment', 'No checkout link was returned.');
          return;
        }

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = checkout.checkoutUrl;
          return;
        }

        await Linking.openURL(checkout.checkoutUrl);
      } catch (err) {
        notify('Could not start payment', getErrorMessage(err, 'Try again in a moment.'));
      }
    },
    []
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
      notify('Thanks for the review', 'Your rating helps other customers pick the right pro.');
    } catch (err) {
      notify('Could not submit review', getErrorMessage(err, 'Try again in a moment.'));
    } finally {
      setSubmittingReview(false);
    }
  }, [reviewForm, reviewJob]);

  const openEditJob = useCallback((job) => {
    setEditForm({ jobName: job.jobName ?? '', jobDescription: job.jobDescription ?? '' });
    setEditJob(job);
  }, []);

  const saveJobEdit = useCallback(async () => {
    if (!editJob) return;
    if (!editForm.jobName.trim()) {
      notify('Add a title', 'The job needs a short title.');
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
        latitude: editJob.latitude,
        longitude: editJob.longitude,
      });
      setEditJob(null);
      await refresh();
      notify('Job updated', 'Professionals will see the new details.');
    } catch (err) {
      notify('Could not update job', getErrorMessage(err, 'Try again in a moment.'));
    } finally {
      setSavingEdit(false);
    }
  }, [editForm, editJob, refresh]);

  const deleteJob = useCallback(
    async (job) => {
      const confirmed = await confirmAction(
        'Delete this job?',
        `"${job.jobName}" and any quotes on it will be removed. This cannot be undone.`,
        'Delete'
      );
      if (!confirmed) return;

      try {
        await api.delete(`/Jobs/${job.jobId}`);
        await refresh();
        notify('Job deleted', 'The job and its quotes were removed.');
      } catch (err) {
        notify('Could not delete job', getErrorMessage(err, 'Try again in a moment.'));
      }
    },
    [refresh]
  );

  const completeJob = useCallback(
    async (job) => {
      const confirmed = await confirmAction(
        'Mark job complete?',
        'Confirm the work is finished to close this job.',
        'Mark complete'
      );
      if (!confirmed) return;

      try {
        await api.post(`/Jobs/${job.jobId}/complete`);
        await refresh();
        notify('Job completed', 'Nice one — the job is now closed.');
      } catch (err) {
        notify('Could not complete job', getErrorMessage(err, 'Try again in a moment.'));
      }
    },
    [refresh]
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
        <Text style={styles.mutedText}>Loading your Worka workspace...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <MaterialCommunityIcons name="cloud-alert-outline" size={34} color="#111" />
        <Text style={styles.errorTitle}>Could not load jobs</Text>
        <Text style={styles.mutedText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={refresh}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
    <FlatList
      data={visibleJobs}
      keyExtractor={(item) => String(item.jobId)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View>
          {checkoutMessage ? (
            <View style={[styles.checkoutBanner, checkoutMessage.type === 'success' && styles.checkoutBannerSuccess]}>
              <MaterialCommunityIcons
                name={checkoutMessage.type === 'success' ? 'check-circle-outline' : 'alert-circle-outline'}
                size={22}
                color="#111"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.checkoutBannerTitle}>{checkoutMessage.title}</Text>
                <Text style={styles.checkoutBannerText}>{checkoutMessage.text}</Text>
              </View>
              <TouchableOpacity style={styles.bannerClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setCheckoutMessage(null)}>
                <MaterialCommunityIcons name="close" size={18} color="#111" />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Customer marketplace</Text>
            <Text style={styles.heroTitle}>
              {account ? `Good to see you, ${account.firstName}.` : 'Your Worka pipeline'}
            </Text>
            <Text style={styles.heroText}>Post work, compare quotes, and book the right pro.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation?.navigate('Post a Job')}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Post a job</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {recentActivity.length > 0 ? (
            <View style={styles.activityCard}>
              <Text style={styles.activityTitle}>Recent activity</Text>
              {recentActivity.map((entry) => (
                <View key={entry.id} style={styles.activityRow}>
                  <View style={[styles.activityDot, entry.booked && styles.activityDotBooked]}>
                    <MaterialCommunityIcons
                      name={entry.booked ? 'check' : 'file-document-outline'}
                      size={14}
                      color={entry.booked ? '#24513b' : '#111'}
                    />
                  </View>
                  <Text style={styles.activityText}>
                    {entry.booked ? 'Booked ' : 'New quote '}
                    <Text style={styles.activityStrong}>{formatMoney(entry.price)}</Text>
                    {' on '}
                    <Text style={styles.activityStrong}>{entry.jobName}</Text>
                  </Text>
                  <Text style={styles.activityWhen}>{entry.when}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[styles.segment, jobFilter === 'active' && styles.segmentActive]}
              onPress={() => setJobFilter('active')}
            >
              <Text style={[styles.segmentText, jobFilter === 'active' && styles.segmentTextActive]}>
                Active ({activeJobs.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, jobFilter === 'past' && styles.segmentActive]}
              onPress={() => setJobFilter('past')}
            >
              <Text style={[styles.segmentText, jobFilter === 'past' && styles.segmentTextActive]}>
                Past ({pastJobs.length})
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Your jobs</Text>
        </View>
      }
      ListEmptyComponent={
        jobFilter === 'past' ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={40} color="#111" />
            <Text style={styles.emptyTitle}>No past jobs yet</Text>
            <Text style={styles.mutedText}>Completed and closed jobs will appear here.</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-plus-outline" size={40} color="#111" />
            <Text style={styles.emptyTitle}>No active jobs</Text>
            <Text style={styles.mutedText}>Create your first job to start receiving quotes.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation?.navigate('Post a Job')}>
              <Text style={styles.primaryButtonText}>Post a job</Text>
            </TouchableOpacity>
          </View>
        )
      }
      renderItem={({ item }) => (
        <JobCard
          job={item}
          quotes={quotesByJob[item.jobId] ?? []}
          onAcceptQuote={(quote) => acceptQuote(item, quote)}
          onEditJob={openEditJob}
          onDeleteJob={deleteJob}
          onCompleteJob={completeJob}
          onReviewJob={openReview}
        />
      )}
    />

    <Modal visible={!!editJob} transparent animationType="slide" onRequestClose={() => setEditJob(null)}>
      <View style={styles.editBackdrop}>
        <View style={styles.editCard}>
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>Edit job</Text>
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
            placeholder="Job title"
            placeholderTextColor="#686b64"
          />
          <TextInput
            style={[styles.editInput, styles.editTextArea]}
            value={editForm.jobDescription}
            onChangeText={(jobDescription) => setEditForm((current) => ({ ...current, jobDescription }))}
            placeholder="Describe the work"
            placeholderTextColor="#686b64"
            multiline
          />

          <TouchableOpacity style={styles.editSaveButton} onPress={saveJobEdit} disabled={savingEdit}>
            {savingEdit ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.editSaveText}>Save changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    <Modal visible={!!reviewJob} transparent animationType="slide" onRequestClose={() => setReviewJob(null)}>
      <View style={styles.editBackdrop}>
        <View style={styles.editCard}>
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>Leave a review</Text>
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
            placeholder="How did the work go?"
            placeholderTextColor="#686b64"
            multiline
          />

          <TouchableOpacity style={styles.editSaveButton} onPress={submitReview} disabled={submittingReview}>
            {submittingReview ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.editSaveText}>Submit review</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 96,
    backgroundColor: '#f7f5ef',
    width: '100%',
    maxWidth: 880,
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: '#18201d',
    borderRadius: 8,
    padding: 18,
    marginBottom: 14,
  },
  eyebrow: {
    color: '#d6f36a',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroText: {
    color: '#d8ded8',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginBottom: 18,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 150,
    minHeight: 82,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e3dfd2',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111',
  },
  statLabel: {
    marginTop: 4,
    color: '#62645c',
    fontWeight: '700',
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
