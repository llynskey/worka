import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { api, formatMoney, unwrap } from '../api/workaApi';
import { useI18n } from '../i18n/I18nContext';
import { colors, radius, shadow } from '../Utils/theme';

/**
 * Earnings (professional) or payment-history / receipts (customer), read from
 * the paid WorkaPayment rows. `mode`: 'earnings' | 'history'.
 */
const PaymentsPanel = ({ mode = 'earnings' }) => {
  const { t } = useI18n();
  const isEarnings = mode === 'earnings';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get(isEarnings ? '/api/payments/earnings' : '/api/payments/history');
      setData(unwrap(res.data));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isEarnings]);

  useEffect(() => {
    load();
  }, [load]);

  const payments = data?.payments ?? [];
  const currency = data?.currency ?? 'gbp';
  const headline = isEarnings ? data?.totalEarned ?? 0 : data?.totalSpent ?? 0;
  const count = isEarnings ? data?.bookingsCount ?? 0 : data?.paymentsCount ?? 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{isEarnings ? t('earnings.title') : t('earnings.historyTitle')}</Text>

      {loading ? (
        <ActivityIndicator color="#111" style={{ marginVertical: 16 }} />
      ) : (
        <>
          <View style={styles.statRow}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{formatMoney(headline, currency)}</Text>
              <Text style={styles.statLabel}>{isEarnings ? t('earnings.totalEarned') : t('earnings.totalSpent')}</Text>
            </View>
            {isEarnings ? (
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{formatMoney(data?.thisMonth ?? 0, currency)}</Text>
                <Text style={styles.statLabel}>{t('earnings.thisMonth')}</Text>
              </View>
            ) : null}
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{count}</Text>
              <Text style={styles.statLabel}>{isEarnings ? t('earnings.bookings') : t('earnings.payments')}</Text>
            </View>
          </View>

          {payments.length === 0 ? (
            <Text style={styles.empty}>{isEarnings ? t('earnings.emptyEarnings') : t('earnings.emptyHistory')}</Text>
          ) : (
            payments.map((p) => (
              <View key={p.paymentId} style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowJob} numberOfLines={1}>{p.jobName || t('jobs.aJob')}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {p.counterpartName ? `${p.counterpartName} · ` : ''}
                    {new Date(p.paidAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.rowAmount}>
                  {formatMoney(isEarnings ? p.workerAmount : p.totalAmount, p.currency)}
                </Text>
              </View>
            ))
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
    ...shadow.card,
  },
  title: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: 100,
    minWidth: 100,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
  },
  statValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  empty: {
    color: colors.muted,
    marginTop: 10,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowJob: {
    color: colors.ink,
    fontWeight: '800',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  rowAmount: {
    color: colors.ink,
    fontWeight: '900',
  },
});

export default PaymentsPanel;
