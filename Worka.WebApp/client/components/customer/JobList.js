import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, formatMoney, unwrap, getErrorMessage } from '../../api/workaApi';
import JobCard from './JobCard';

const statusLabel = (status) => {
  if (status === 1 || String(status).toLowerCase() === 'accepted') return 'Booked';
  if (status === 2 || String(status).toLowerCase() === 'rejected') return 'Closed';
  return 'Open';
};

const CustomerJobList = ({ navigation }) => {
  const [account, setAccount] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    const accountResponse = await api.get('/api/Customer/account');
    const accountData = unwrap(accountResponse.data);
    setAccount(accountData);

    const [jobsResponse, quotesResponse] = await Promise.all([
      api.get('/CustomerJobs', { params: { customerId: accountData.customerId } }),
      api.get('/CustomerQuotes', { params: { customerId: accountData.customerId } }),
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

  const acceptQuote = useCallback(
    async (job, quote) => {
      try {
        await api.post(`/Jobs/${job.jobId}/acceptQuote`, { quoteId: quote.quoteId });
        Alert.alert('Quote accepted', 'Your job has been marked as booked.');
        await refresh();
      } catch (err) {
        Alert.alert('Could not accept quote', getErrorMessage(err, 'Try again in a moment.'));
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
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.jobId}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View>
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

          <Text style={styles.sectionTitle}>Your jobs</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="clipboard-plus-outline" size={40} color="#111" />
          <Text style={styles.emptyTitle}>No jobs posted yet</Text>
          <Text style={styles.mutedText}>Create your first job to start receiving quotes.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation?.navigate('Post a Job')}>
            <Text style={styles.primaryButtonText}>Post a job</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <JobCard
          job={item}
          quotes={quotesByJob[item.jobId] ?? []}
          onAcceptQuote={(quote) => acceptQuote(item, quote)}
        />
      )}
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
    width: '47.8%',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    marginBottom: 8,
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
});

export default CustomerJobList;
