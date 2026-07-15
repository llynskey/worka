import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, formatDate, formatMoney, getErrorMessage, unwrap } from '../../api/workaApi';
import Avatar from '../Avatar';
import Stars from '../Stars';
import SelectField from '../SelectField';
import useAutoRefresh from '../../Utils/useAutoRefresh';
import { SPOKEN_LANGUAGES, languageLabel } from '../../i18n/spokenLanguages';
import { useI18n } from '../../i18n/I18nContext';
import { categoryLabel } from '../../i18n/categories';

const parseLanguages = (value) =>
  String(value ?? '')
    .split(',')
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);

// Stable English values — sent to the API as the specialty filter.
// Displayed labels resolve through categoryLabel(t, chip) at render time.
const specialtyChips = ['Plumbing', 'Electrical', 'Painting', 'Cleaning', 'Garden', 'Repairs'];

const ProDirectory = () => {
  const { t } = useI18n();
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedPro, setSelectedPro] = useState(null);
  const [proReviews, setProReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const openProDetails = useCallback(async (pro) => {
    setSelectedPro(pro);
    setProReviews([]);
    try {
      setReviewsLoading(true);
      const response = await api.get(`/api/Professionals/${pro.professionalId}/reviews`);
      setProReviews(unwrap(response.data) ?? []);
    } catch {
      setProReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const loadPros = useCallback(async () => {
    setError(null);
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (area.trim()) params.area = area.trim();
    if (specialty) params.specialty = specialty;
    if (languageFilter) params.language = languageFilter;
    const price = Number(maxPrice);
    if (maxPrice.trim() && Number.isFinite(price) && price > 0) params.maxPrice = price;

    const response = await api.get('/api/Professionals/directory', { params });
    setPros(unwrap(response.data) ?? []);
  }, [area, languageFilter, maxPrice, search, specialty]);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadPros();
    } catch (err) {
      setError(getErrorMessage(err, t('directory.loadError')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadPros, t]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialty, languageFilter]);

  // Silent background refresh so newly joined professionals appear
  // without a manual reload.
  useAutoRefresh(loadPros, 30000);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
        <Text style={styles.mutedText}>{t('directory.finding')}</Text>
      </View>
    );
  }

  return (
    <>
    <FlatList
      data={pros}
      keyExtractor={(item) => String(item.professionalId)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>{t('tabs.pros')}</Text>
            <Text style={styles.heroTitle}>{t('directory.heroTitle')}</Text>
            <Text style={styles.heroText}>{t('directory.heroText')}</Text>
          </View>

          <View style={styles.filterCard}>
            <View style={styles.filterRow}>
              <View style={styles.searchBox}>
                <MaterialCommunityIcons name="magnify" size={19} color="#62645c" />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('directory.searchPlaceholder')}
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
                  placeholder={t('directory.areaPlaceholder')}
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
                  placeholder={t('directory.maxPricePlaceholder')}
                  placeholderTextColor="#686b64"
                  keyboardType="numeric"
                  returnKeyType="search"
                  onSubmitEditing={refresh}
                />
              </View>
            </View>

            <Text style={styles.filterGroupLabel}>{t('directory.serviceLabel')}</Text>
            <View style={styles.chipRow}>
              {specialtyChips.map((chip) => {
                const active = specialty === chip;
                return (
                  <TouchableOpacity
                    key={chip}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSpecialty(active ? '' : chip)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{categoryLabel(t, chip)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.filterDivider} />

            <SelectField
              label={t('directory.languageLabel')}
              options={SPOKEN_LANGUAGES.map((language) => ({
                value: language.code,
                label: language.label,
              }))}
              value={languageFilter}
              onChange={(code) => setLanguageFilter(code || '')}
              placeholder={t('directory.anyLanguage')}
              searchPlaceholder={t('common.search')}
              allowClear
              clearLabel={t('directory.anyLanguage')}
            />

            <TouchableOpacity style={styles.applyButton} onPress={refresh}>
              <MaterialCommunityIcons name="filter-check-outline" size={18} color="#fff" />
              <Text style={styles.applyButtonText}>{t('directory.applyFilters')}</Text>
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
          <Text style={styles.emptyTitle}>{t('directory.emptyTitle')}</Text>
          <Text style={styles.mutedText}>{t('directory.emptyText')}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openProDetails(item)}>
          <View style={styles.cardHeader}>
            <Avatar photoUrl={item.photoUrl} firstName={item.firstName} lastName={item.lastName} size={46} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.cardSpecialty}>{item.specialty || t('directory.generalServices')}</Text>
              <View style={styles.cardStars}>
                <Stars value={item.averageRating} count={item.reviewCount} emptyLabel={t('reviews.none')} />
              </View>
            </View>
            {item.readyForPayments ? (
              <View style={styles.verifiedPill}>
                <MaterialCommunityIcons name="shield-check-outline" size={14} color="#24513b" />
                <Text style={styles.verifiedText}>{t('directory.payoutReady')}</Text>
              </View>
            ) : null}
          </View>

          {item.languages ? (
            <View style={styles.langChipRow}>
              {parseLanguages(item.languages).map((code) => (
                <View key={code} style={styles.langChip}>
                  <Text style={styles.langChipText}>{languageLabel(code)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {item.bio ? (
            <Text style={styles.cardBio} numberOfLines={3}>
              {item.bio}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#62645c" />
            <Text style={styles.metaText}>{item.serviceArea || t('directory.areaNotListed')}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{item.quoteCount}</Text>
              <Text style={styles.statLabel}>{t('directory.quotesSent')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {item.averageQuotePrice != null ? formatMoney(item.averageQuotePrice) : '—'}
              </Text>
              <Text style={styles.statLabel}>{t('directory.avgPrice')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {item.minQuotePrice != null ? formatMoney(item.minQuotePrice) : '—'}
              </Text>
              <Text style={styles.statLabel}>{t('directory.from')}</Text>
            </View>
          </View>

          <View style={styles.viewProfileRow}>
            <Text style={styles.viewProfileText}>{t('directory.viewProfile')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#111" />
          </View>
        </TouchableOpacity>
      )}
    />

    <Modal visible={!!selectedPro} transparent animationType="slide" onRequestClose={() => setSelectedPro(null)}>
      <View style={styles.proModalBackdrop}>
        <View style={styles.proModalCard}>
          <ScrollView contentContainerStyle={styles.proModalContent} showsVerticalScrollIndicator={false}>
            {selectedPro ? (
              <>
                <View style={styles.proModalHeader}>
                  <Avatar
                    photoUrl={selectedPro.photoUrl}
                    firstName={selectedPro.firstName}
                    lastName={selectedPro.lastName}
                    size={72}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.proModalName}>
                      {selectedPro.firstName} {selectedPro.lastName}
                    </Text>
                    <Text style={styles.cardSpecialty}>
                      {selectedPro.specialty || t('directory.generalServices')}
                    </Text>
                    <View style={styles.cardStars}>
                      <Stars
                        value={selectedPro.averageRating}
                        count={selectedPro.reviewCount}
                        emptyLabel={t('reviews.none')}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.proModalClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => setSelectedPro(null)}
                  >
                    <MaterialCommunityIcons name="close" size={22} color="#111" />
                  </TouchableOpacity>
                </View>

                {selectedPro.readyForPayments ? (
                  <View style={[styles.verifiedPill, styles.proModalPill]}>
                    <MaterialCommunityIcons name="shield-check-outline" size={14} color="#24513b" />
                    <Text style={styles.verifiedText}>{t('directory.payoutReadyBookable')}</Text>
                  </View>
                ) : null}

                {selectedPro.languages ? (
                  <View style={styles.langChipRow}>
                    {parseLanguages(selectedPro.languages).map((code) => (
                      <View key={code} style={styles.langChip}>
                        <Text style={styles.langChipText}>{languageLabel(code)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {selectedPro.bio ? <Text style={styles.proModalBio}>{selectedPro.bio}</Text> : null}

                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={16} color="#62645c" />
                  <Text style={styles.metaText}>{selectedPro.serviceArea || t('directory.areaNotListed')}</Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{selectedPro.quoteCount}</Text>
                    <Text style={styles.statLabel}>{t('directory.quotesSent')}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {selectedPro.averageQuotePrice != null
                        ? formatMoney(selectedPro.averageQuotePrice)
                        : '—'}
                    </Text>
                    <Text style={styles.statLabel}>{t('directory.avgPrice')}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {selectedPro.minQuotePrice != null ? formatMoney(selectedPro.minQuotePrice) : '—'}
                    </Text>
                    <Text style={styles.statLabel}>{t('directory.from')}</Text>
                  </View>
                </View>

                <Text style={styles.reviewsTitle}>{t('reviews.title')}</Text>
                {reviewsLoading ? (
                  <ActivityIndicator color="#111" style={{ marginVertical: 16 }} />
                ) : proReviews.length === 0 ? (
                  <Text style={styles.mutedText}>{t('directory.noReviews')}</Text>
                ) : (
                  proReviews.map((review) => (
                    <View key={review.reviewId} style={styles.reviewRow}>
                      <Stars value={review.rating} />
                      {review.comment ? (
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                      ) : null}
                      <Text style={styles.reviewMeta}>
                        {review.reviewerFirstName} · {review.jobName} · {formatDate(review.createdAt)}
                      </Text>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  viewProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    marginTop: 12,
  },
  viewProfileText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
  },
  proModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.46)',
    justifyContent: 'flex-end',
  },
  proModalCard: {
    maxHeight: '92%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  proModalContent: {
    padding: 18,
    paddingBottom: 32,
  },
  proModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  proModalName: {
    color: '#111',
    fontSize: 24,
    fontWeight: '900',
  },
  proModalClose: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  proModalPill: {
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  proModalBio: {
    marginTop: 12,
    color: '#4d504b',
    lineHeight: 21,
  },
  reviewsTitle: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#ece7dc',
    paddingTop: 14,
    color: '#111',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  reviewRow: {
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fbfaf6',
  },
  reviewComment: {
    marginTop: 6,
    color: '#4d504b',
    lineHeight: 20,
  },
  reviewMeta: {
    marginTop: 6,
    color: '#8a8d84',
    fontSize: 12,
    fontWeight: '700',
  },
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
  cardStars: {
    marginTop: 4,
  },
  filterGroupLabel: {
    color: '#111',
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 8,
  },
  filterDivider: {
    height: 1,
    backgroundColor: '#ece7dc',
    marginBottom: 12,
  },
  langChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  langChip: {
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: '#fbfaf6',
  },
  langChipText: {
    color: '#62645c',
    fontSize: 11,
    fontWeight: '800',
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
