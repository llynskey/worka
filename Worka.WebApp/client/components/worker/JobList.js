import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, formatDate, formatMoney, getErrorMessage, unwrap } from '../../api/workaApi';

const WorkerJobList = () => {
  const [account, setAccount] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ price: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadMarketplace = useCallback(async () => {
    setError(null);
    const accountResponse = await api.get('/api/Professionals/account');
    const accountData = unwrap(accountResponse.data);
    setAccount(accountData);

    const [jobsResponse, quotesResponse] = await Promise.all([
      api.get('/Jobs'),
      api.get('/ProfessionalQuotes', { params: { professionalId: accountData.professionalId } }),
    ]);

    setJobs(unwrap(jobsResponse.data) ?? []);
    setQuotes(unwrap(quotesResponse.data) ?? []);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadMarketplace();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load available jobs.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadMarketplace]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const quoteByJob = useMemo(() => {
    return quotes.reduce((acc, quote) => {
      acc[quote.jobId] = quote;
      return acc;
    }, {});
  }, [quotes]);

  const openJobs = useMemo(() => {
    return jobs.filter((job) => !job.acceptedQuoteId);
  }, [jobs]);

  const openQuoteModal = (job) => {
    setSelectedJob(job);
    setQuoteForm({
      price: '',
      description: `I can complete this ${job.category || 'job'} with clear pricing and tidy handover.`,
    });
  };

  const submitQuote = async () => {
    const amount = Number(quoteForm.price);
    if (!selectedJob || !account?.professionalId) return;
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Add a price', 'Enter a valid quote amount.');
      return;
    }
    if (!quoteForm.description.trim()) {
      Alert.alert('Add a note', 'Tell the customer what is included.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/createQuote', {
        jobId: selectedJob.jobId,
        professionalId: account.professionalId,
        price: amount,
        description: quoteForm.description.trim(),
      });
      setSelectedJob(null);
      await refresh();
      Alert.alert('Quote sent', 'The customer can now review your quote.');
    } catch (err) {
      Alert.alert('Could not send quote', getErrorMessage(err, 'Try again in a moment.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
        <Text style={styles.mutedText}>Loading jobs near your marketplace...</Text>
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
        data={openJobs}
        keyExtractor={(item) => item.jobId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Professional marketplace</Text>
            <Text style={styles.heroTitle}>
              {account ? `${account.firstName}, quote jobs that fit.` : 'Quote jobs that fit.'}
            </Text>
            <Text style={styles.heroText}>
              Review open customer jobs, send a clear price, and track every bid in one place.
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statValue}>{openJobs.length}</Text>
                <Text style={styles.statLabel}>Open jobs</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statValue}>{quotes.length}</Text>
                <Text style={styles.statLabel}>Your bids</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="briefcase-check-outline" size={40} color="#111" />
            <Text style={styles.emptyTitle}>No open jobs right now</Text>
            <Text style={styles.mutedText}>Pull to refresh and check back for new customer requests.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const existingQuote = quoteByJob[item.jobId];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryIcon}>
                  <MaterialCommunityIcons name="hammer-wrench" size={22} color="#111" />
                </View>
                <View style={styles.cardTitleBlock}>
                  <Text style={styles.cardTitle}>{item.jobName}</Text>
                  <Text style={styles.cardMeta}>{item.category || 'Home services'} - {formatDate(item.createdAt)}</Text>
                </View>
              </View>

              <Text style={styles.description}>{item.jobDescription}</Text>

              {!!item.address && (
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={17} color="#64675f" />
                  <Text style={styles.locationText}>{item.address}</Text>
                </View>
              )}

              {existingQuote ? (
                <View style={styles.quotedBox}>
                  <Text style={styles.quotedLabel}>Your quote</Text>
                  <Text style={styles.quotedAmount}>{formatMoney(existingQuote.price)}</Text>
                  <Text style={styles.quotedDescription}>{existingQuote.description}</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={() => openQuoteModal(item)}>
                  <MaterialCommunityIcons name="cash-plus" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Send quote</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      <Modal visible={!!selectedJob} transparent animationType="slide" onRequestClose={() => setSelectedJob(null)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboard}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send quote</Text>
                <TouchableOpacity onPress={() => setSelectedJob(null)} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={22} color="#111" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalJobTitle}>{selectedJob?.jobName}</Text>
              <TextInput
                style={styles.input}
                value={quoteForm.price}
                onChangeText={(price) => setQuoteForm((current) => ({ ...current, price }))}
                placeholder="Price"
                placeholderTextColor="#686b64"
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={quoteForm.description}
                onChangeText={(description) => setQuoteForm((current) => ({ ...current, description }))}
                placeholder="What is included?"
                placeholderTextColor="#686b64"
                multiline
              />

              <TouchableOpacity style={styles.submitButton} onPress={submitQuote} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send-outline" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Send quote</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroText: {
    color: '#d8ded8',
    fontSize: 15,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: '#d8ded8',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1ede4',
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    color: '#111',
    fontSize: 18,
    fontWeight: '900',
  },
  cardMeta: {
    color: '#696b64',
    fontWeight: '700',
    marginTop: 3,
  },
  description: {
    color: '#4d504b',
    lineHeight: 20,
    marginTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  locationText: {
    flex: 1,
    color: '#64675f',
    fontWeight: '600',
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
    marginTop: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
  quotedBox: {
    marginTop: 14,
    backgroundColor: '#e8f5ed',
    borderRadius: 8,
    padding: 12,
  },
  quotedLabel: {
    color: '#24513b',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  quotedAmount: {
    color: '#111',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },
  quotedDescription: {
    color: '#3f5b4d',
    marginTop: 4,
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
  mutedText: {
    color: '#63665f',
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#111',
    fontSize: 22,
    fontWeight: '900',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1ede4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalJobTitle: {
    color: '#565951',
    fontWeight: '800',
    marginBottom: 12,
  },
  input: {
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
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});

export default WorkerJobList;
