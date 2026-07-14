import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, formatDate, formatMoney, getErrorMessage, unwrap } from '../../api/workaApi';

const BidList = () => {
  const [account, setAccount] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadBids = useCallback(async () => {
    setError(null);
    const accountResponse = await api.get('/api/Professionals/account');
    const accountData = unwrap(accountResponse.data);
    setAccount(accountData);

    const [quotesResponse, jobsResponse] = await Promise.all([
      api.get('/ProfessionalQuotes', { params: { professionalId: accountData.professionalId } }),
      api.get('/Jobs'),
    ]);

    setQuotes(unwrap(quotesResponse.data) ?? []);
    setJobs(unwrap(jobsResponse.data) ?? []);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadBids();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your bids.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadBids]);

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

  const acceptedCount = useMemo(() => {
    return quotes.filter((quote) => jobsById[quote.jobId]?.acceptedQuoteId === quote.quoteId).length;
  }, [jobsById, quotes]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
        <Text style={styles.mutedText}>Loading your bids...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <MaterialCommunityIcons name="cloud-alert-outline" size={34} color="#111" />
        <Text style={styles.errorTitle}>Could not load bids</Text>
        <Text style={styles.mutedText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={refresh}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={quotes}
      keyExtractor={(item) => item.quoteId}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Bid desk</Text>
          <Text style={styles.heroTitle}>{account ? `${account.firstName}'s quotes` : 'Your quotes'}</Text>
          <Text style={styles.heroText}>Track submitted prices and see which jobs have been booked.</Text>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{quotes.length}</Text>
              <Text style={styles.statLabel}>Sent</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{acceptedCount}</Text>
              <Text style={styles.statLabel}>Accepted</Text>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="file-document-edit-outline" size={40} color="#111" />
          <Text style={styles.emptyTitle}>No bids yet</Text>
          <Text style={styles.mutedText}>Send a quote from Available Jobs to build your bid pipeline.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const job = jobsById[item.jobId];
        const accepted = job?.acceptedQuoteId === item.quoteId;
        const bookedElsewhere = job?.acceptedQuoteId && job.acceptedQuoteId !== item.quoteId;

        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{job?.jobName ?? 'Job unavailable'}</Text>
                <Text style={styles.cardMeta}>{job?.category ?? 'Home services'} - {formatDate(item.createdAt)}</Text>
              </View>
              <View style={[styles.statusPill, accepted && styles.statusAccepted, bookedElsewhere && styles.statusClosed]}>
                <Text style={[styles.statusText, accepted && styles.statusTextAccepted]}>
                  {accepted ? 'Accepted' : bookedElsewhere ? 'Booked' : 'Pending'}
                </Text>
              </View>
            </View>

            <Text style={styles.amount}>{formatMoney(item.price)}</Text>
            <Text style={styles.description}>{item.description || 'No quote note provided.'}</Text>
            {accepted ? (
              <View style={styles.payoutBox}>
                <MaterialCommunityIcons name="cash-fast" size={18} color="#24513b" />
                <Text style={styles.payoutText}>
                  Customer booked this quote. Your share is {formatMoney(item.price)} and is paid out through Stripe Connect once your payout account is ready.
                </Text>
              </View>
            ) : (
              <View style={styles.pendingBox}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#111" />
                <Text style={styles.pendingText}>The customer can review this quote and pay securely through Worka.</Text>
              </View>
            )}
          </View>
        );
      }}
    />
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
    justifyContent: 'space-between',
    gap: 12,
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
  amount: {
    color: '#111',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 12,
  },
  description: {
    color: '#4d504b',
    lineHeight: 20,
    marginTop: 6,
  },
  payoutBox: {
    marginTop: 12,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#e8f5ed',
    flexDirection: 'row',
    gap: 8,
  },
  payoutText: {
    flex: 1,
    color: '#24513b',
    fontWeight: '800',
    lineHeight: 20,
  },
  pendingBox: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 12,
    backgroundColor: '#fbfaf6',
    flexDirection: 'row',
    gap: 8,
  },
  pendingText: {
    flex: 1,
    color: '#111',
    fontWeight: '800',
    lineHeight: 20,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1ede4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusAccepted: {
    backgroundColor: '#dff4e8',
  },
  statusClosed: {
    backgroundColor: '#eee',
  },
  statusText: {
    color: '#565951',
    fontWeight: '900',
    fontSize: 12,
  },
  statusTextAccepted: {
    color: '#24513b',
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
  primaryButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
});

export default BidList;
