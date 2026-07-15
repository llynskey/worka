import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import notify, { confirmAction } from '../../Utils/notify';
import { useI18n } from '../../i18n/I18nContext';
import { categoryLabel } from '../../i18n/categories';

const BidList = () => {
  const { t } = useI18n();
  const [account, setAccount] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [editQuote, setEditQuote] = useState(null);
  const [editForm, setEditForm] = useState({ price: '', description: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadBids = useCallback(async () => {
    setError(null);
    const accountResponse = await api.get('/api/Professionals/account');
    const accountData = unwrap(accountResponse.data);
    setAccount(accountData);

    const [quotesResponse, jobsResponse] = await Promise.all([
      api.get('/ProfessionalQuotes'),
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
      setError(getErrorMessage(err, t('bids.loadError')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadBids, t]);

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

  const openEditQuote = useCallback((quote) => {
    setEditForm({ price: String(quote.price ?? ''), description: quote.description ?? '' });
    setEditQuote(quote);
  }, []);

  const saveQuoteEdit = useCallback(async () => {
    if (!editQuote) return;
    const amount = Number(editForm.price);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify(t('quotes.addPriceTitle'), t('quotes.addPriceText'));
      return;
    }

    try {
      setSavingEdit(true);
      await api.put(`/Quotes/${editQuote.quoteId}`, {
        price: amount,
        description: editForm.description.trim(),
      });
      setEditQuote(null);
      await refresh();
      notify(t('quotes.updatedTitle'), t('quotes.updatedText'));
    } catch (err) {
      notify(t('quotes.updateErrorTitle'), getErrorMessage(err, t('common.tryAgain')));
    } finally {
      setSavingEdit(false);
    }
  }, [editForm, editQuote, refresh, t]);

  const withdrawQuote = useCallback(
    async (quote) => {
      const confirmed = await confirmAction(
        t('bids.withdrawConfirmTitle'),
        t('bids.withdrawConfirmText', { amount: formatMoney(quote.price) }),
        t('bids.withdraw'),
        t('common.cancel')
      );
      if (!confirmed) return;

      try {
        await api.delete(`/Quotes/${quote.quoteId}`);
        await refresh();
        notify(t('bids.withdrawnTitle'), t('bids.withdrawnText'));
      } catch (err) {
        notify(t('bids.withdrawErrorTitle'), getErrorMessage(err, t('common.tryAgain')));
      }
    },
    [refresh, t]
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
        <Text style={styles.mutedText}>{t('bids.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <MaterialCommunityIcons name="cloud-alert-outline" size={34} color="#111" />
        <Text style={styles.errorTitle}>{t('bids.couldNotLoad')}</Text>
        <Text style={styles.mutedText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={refresh}>
          <Text style={styles.primaryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
    <FlatList
      data={quotes}
      keyExtractor={(item) => String(item.quoteId)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{t('bids.eyebrow')}</Text>
          <Text style={styles.heroTitle}>
            {account ? t('bids.heroTitleNamed', { name: account.firstName }) : t('bids.heroTitle')}
          </Text>
          <Text style={styles.heroText}>{t('bids.heroText')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{quotes.length}</Text>
              <Text style={styles.statLabel}>{t('bids.sent')}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{acceptedCount}</Text>
              <Text style={styles.statLabel}>{t('status.accepted')}</Text>
            </View>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="file-document-edit-outline" size={40} color="#111" />
          <Text style={styles.emptyTitle}>{t('bids.emptyTitle')}</Text>
          <Text style={styles.mutedText}>{t('bids.emptyText')}</Text>
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
                <Text style={styles.cardTitle}>{job?.jobName ?? t('bids.jobUnavailable')}</Text>
                <Text style={styles.cardMeta}>{categoryLabel(t, job?.category)} - {formatDate(item.createdAt)}</Text>
              </View>
              <View style={[styles.statusPill, accepted && styles.statusAccepted, bookedElsewhere && styles.statusClosed]}>
                <Text style={[styles.statusText, accepted && styles.statusTextAccepted]}>
                  {accepted ? t('status.accepted') : bookedElsewhere ? t('status.booked') : t('status.pending')}
                </Text>
              </View>
            </View>

            <Text style={styles.amount}>{formatMoney(item.price, job?.currency)}</Text>
            <Text style={styles.description}>{item.description || t('quotes.noNote')}</Text>
            {accepted ? (
              <View style={styles.payoutBox}>
                <MaterialCommunityIcons name="cash-fast" size={18} color="#24513b" />
                <Text style={styles.payoutText}>
                  {t('bids.payoutText', { amount: formatMoney(item.price, job?.currency) })}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.pendingBox}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#111" />
                  <Text style={styles.pendingText}>{t('bids.pendingText')}</Text>
                </View>
                {!bookedElsewhere && (
                  <View style={styles.quoteActions}>
                    <TouchableOpacity style={styles.quoteActionButton} onPress={() => openEditQuote(item)}>
                      <MaterialCommunityIcons name="pencil-outline" size={17} color="#111" />
                      <Text style={styles.quoteActionText}>{t('common.edit')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quoteActionButton} onPress={() => withdrawQuote(item)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={17} color="#8c2f2f" />
                      <Text style={[styles.quoteActionText, styles.quoteActionDanger]}>{t('bids.withdraw')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        );
      }}
    />

    <Modal visible={!!editQuote} transparent animationType="slide" onRequestClose={() => setEditQuote(null)}>
      <View style={styles.editBackdrop}>
        <View style={styles.editCard}>
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>{t('bids.editQuote')}</Text>
            <TouchableOpacity
              style={styles.editClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setEditQuote(null)}
            >
              <MaterialCommunityIcons name="close" size={18} color="#111" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.editInput}
            value={editForm.price}
            onChangeText={(price) => setEditForm((current) => ({ ...current, price }))}
            placeholder={t('quotes.pricePlaceholder', { currency: 'GBP' })}
            placeholderTextColor="#686b64"
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.editInput, styles.editTextArea]}
            value={editForm.description}
            onChangeText={(description) => setEditForm((current) => ({ ...current, description }))}
            placeholder={t('quotes.includedPlaceholder')}
            placeholderTextColor="#686b64"
            multiline
          />

          <TouchableOpacity style={styles.editSaveButton} onPress={saveQuoteEdit} disabled={savingEdit}>
            {savingEdit ? <ActivityIndicator color="#fff" /> : <Text style={styles.editSaveText}>{t('common.saveChanges')}</Text>}
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
  quoteActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  quoteActionButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fbfaf6',
  },
  quoteActionText: {
    color: '#111',
    fontWeight: '800',
  },
  quoteActionDanger: {
    color: '#8c2f2f',
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
  editClose: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
