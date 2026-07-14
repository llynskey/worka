import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, formatMoney, getErrorMessage, unwrap } from '../../api/workaApi';

const specialtyChips = ['Plumbing', 'Electrical', 'Painting', 'Cleaning', 'Garden', 'Repairs'];

const ProDirectory = () => {
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const loadPros = useCallback(async () => {
    setError(null);
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (area.trim()) params.area = area.trim();
    if (specialty) params.specialty = specialty;
    const price = Number(maxPrice);
    if (maxPrice.trim() && Number.isFinite(price) && price > 0) params.maxPrice = price;

    const response = await api.get('/api/Professionals/directory', { params });
    setPros(unwrap(response.data) ?? []);
  }, [area, maxPrice, search, specialty]);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadPros();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load professionals.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadPros]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialty]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
        <Text style={styles.mutedText}>Finding professionals near you...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={pros}
      keyExtractor={(item) => String(item.professionalId)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Find pros</Text>
            <Text style={styles.heroTitle}>Professionals in your area</Text>
            <Text style={styles.heroText}>
              Search by trade, area, or budget, then post a job to get their quotes.
            </Text>
          </View>

          <View style={styles.filterCard}>
            <View style={styles.filterRow}>
              <View style={styles.searchBox}>
                <MaterialCommunityIcons name="magnify" size={19} color="#62645c" />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search name, trade, or skill"
                  placeholderTextColor="#686b64"
                  returnKeyType="search"
                  onSubmitEditing={refresh}
                />
              </View>
            </View>

            <View style={styles.filterRow}>
              <View style={[styles.searchBox, styles.filterHalf]}>
                <MaterialCommunityIcons name="map-marker-outline" size={19} color="#62645c" />
                <TextInput
                  style={styles.searchInput}
                  value={area}
                  onChangeText={setArea}
                  placeholder="Area (e.g. Leeds)"
                  placeholderTextColor="#686b64"
                  returnKeyType="search"
                  onSubmitEditing={refresh}
                />
              </View>
              <View style={[styles.searchBox, styles.filterHalf]}>
                <MaterialCommunityIcons name="cash" size={19} color="#62645c" />
                <TextInput
                  style={styles.searchInput}
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholder="Max avg price"
                  placeholderTextColor="#686b64"
                  keyboardType="numeric"
                  returnKeyType="search"
                  onSubmitEditing={refresh}
                />
              </View>
            </View>

            <View style={styles.chipRow}>
              {specialtyChips.map((chip) => {
                const active = specialty === chip;
                return (
                  <TouchableOpacity
                    key={chip}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSpecialty(active ? '' : chip)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={refresh}>
              <MaterialCommunityIcons name="filter-check-outline" size={18} color="#fff" />
              <Text style={styles.applyButtonText}>Apply filters</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="cloud-alert-outline" size={20} color="#111" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-search-outline" size={40} color="#111" />
          <Text style={styles.emptyTitle}>No professionals found</Text>
          <Text style={styles.mutedText}>
            Try widening the area or clearing the price filter. New pros join Worka every week.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.firstName?.[0] ?? '?').toUpperCase()}
                {(item.lastName?.[0] ?? '').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.cardSpecialty}>{item.specialty || 'General home services'}</Text>
            </View>
            {item.readyForPayments ? (
              <View style={styles.verifiedPill}>
                <MaterialCommunityIcons name="shield-check-outline" size={14} color="#24513b" />
                <Text style={styles.verifiedText}>Payout ready</Text>
              </View>
            ) : null}
          </View>

          {item.bio ? (
            <Text style={styles.cardBio} numberOfLines={3}>
              {item.bio}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#62645c" />
            <Text style={styles.metaText}>{item.serviceArea || 'Area not listed yet'}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{item.quoteCount}</Text>
              <Text style={styles.statLabel}>Quotes sent</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {item.averageQuotePrice != null ? formatMoney(item.averageQuotePrice) : '—'}
              </Text>
              <Text style={styles.statLabel}>Avg price</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {item.minQuotePrice != null ? formatMoney(item.minQuotePrice) : '—'}
              </Text>
              <Text style={styles.statLabel}>From</Text>
            </View>
          </View>
        </View>
      )}
    />
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
    fontWeight: '900',
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
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 14,
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  filterHalf: {
    flex: 1,
    minWidth: 130,
  },
  searchBox: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fbfaf6',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: '#111',
    paddingVertical: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: '#fbfaf6',
  },
  chipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  chipText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
  },
  applyButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#111',
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 13,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: '#111',
    fontWeight: '800',
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
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  cardName: {
    color: '#111',
    fontSize: 17,
    fontWeight: '900',
  },
  cardSpecialty: {
    color: '#62645c',
    fontWeight: '700',
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dff4e8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verifiedText: {
    color: '#24513b',
    fontSize: 12,
    fontWeight: '900',
  },
  cardBio: {
    marginTop: 10,
    color: '#4d504b',
    lineHeight: 20,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flex: 1,
    color: '#62645c',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fbfaf6',
  },
  statValue: {
    color: '#111',
    fontWeight: '900',
    fontSize: 16,
  },
  statLabel: {
    color: '#62645c',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
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
  mutedText: {
    color: '#63665f',
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ProDirectory;
