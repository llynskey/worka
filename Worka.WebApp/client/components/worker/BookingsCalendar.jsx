import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, formatMoney, getErrorMessage, unwrap } from '../../api/workaApi';
import useAutoRefresh from '../../Utils/useAutoRefresh';
import AppFooter from '../AppFooter';
import { useI18n } from '../../i18n/I18nContext';

const MONTH_LOCALES = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR', ro: 'ro-RO' };

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Month calendar of the professional's bookings — jobs where their quote
 * was accepted, placed on the day the booking was made.
 */
const BookingsCalendar = () => {
  const { t, language } = useI18n();
  const [jobs, setJobs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthDate, setMonthDate] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));

  const load = useCallback(async () => {
    try {
      setError(null);
      const [quotesResponse, jobsResponse] = await Promise.all([
        api.get('/ProfessionalQuotes'),
        api.get('/Jobs'),
      ]);
      setQuotes(unwrap(quotesResponse.data) ?? []);
      setJobs(unwrap(jobsResponse.data) ?? []);
    } catch (err) {
      setError(getErrorMessage(err, t('calendar.loadError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // New bookings land on the calendar without a manual reload.
  useAutoRefresh(load, 30000);

  const bookings = useMemo(() => {
    const jobsById = jobs.reduce((acc, job) => {
      acc[job.jobId] = job;
      return acc;
    }, {});

    return quotes
      .filter((quote) => jobsById[quote.jobId]?.acceptedQuoteId === quote.quoteId)
      .map((quote) => {
        const job = jobsById[quote.jobId];
        const when = new Date(job.updatedAt || job.createdAt);
        return {
          id: quote.quoteId,
          day: dayKey(when),
          when,
          jobName: job.jobName,
          location: job.locationLabel || job.address || '',
          amount: quote.price,
          currency: job.currency,
          completed:
            job.jobStatus === 3 || String(job.jobStatus).toLowerCase() === 'completed',
        };
      });
  }, [jobs, quotes]);

  const bookingsByDay = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      acc[booking.day] = acc[booking.day] || [];
      acc[booking.day].push(booking);
      return acc;
    }, {});
  }, [bookings]);

  const weeks = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday-first offset.
    const leadingBlanks = (firstDay.getDay() + 6) % 7;

    const cells = [];
    for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [monthDate]);

  const weekdays = t('calendar.weekdays').split(',');
  const monthLabel = monthDate.toLocaleDateString(MONTH_LOCALES[language] ?? 'en-GB', {
    month: 'long',
    year: 'numeric',
  });
  const todayKey = dayKey(new Date());
  const selectedBookings = bookingsByDay[selectedDay] ?? [];
  const monthTotal = bookings.filter(
    (b) =>
      b.when.getFullYear() === monthDate.getFullYear() &&
      b.when.getMonth() === monthDate.getMonth()
  );

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
        <Text style={styles.mutedText}>{t('calendar.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('calendar.eyebrow')}</Text>
        <Text style={styles.heroTitle}>{t('calendar.heroTitle')}</Text>
        <Text style={styles.heroText}>
          {monthTotal.length === 0
            ? t('calendar.emptyMonth')
            : monthTotal.length === 1
              ? t('calendar.monthCountOne')
              : t('calendar.monthCount', { count: monthTotal.length })}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="cloud-alert-outline" size={20} color="#111" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.calendarCard}>
        <View style={styles.monthRow}>
          <TouchableOpacity
            style={styles.monthButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() =>
              setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))
            }
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity
            style={styles.monthButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() =>
              setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))
            }
          >
            <MaterialCommunityIcons name="chevron-right" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {weekdays.map((weekday) => (
            <Text key={weekday} style={styles.weekdayText}>
              {weekday}
            </Text>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((date, dayIndex) => {
              if (!date) {
                return <View key={`blank-${dayIndex}`} style={styles.dayCell} />;
              }

              const key = dayKey(date);
              const hasBookings = !!bookingsByDay[key];
              const selected = key === selectedDay;
              const isToday = key === todayKey;

              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.dayCell, selected && styles.dayCellSelected]}
                  onPress={() => setSelectedDay(key)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.dayTextToday,
                      selected && styles.dayTextSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  <View
                    style={[
                      styles.dayDot,
                      hasBookings && styles.dayDotActive,
                      hasBookings && selected && styles.dayDotSelected,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        {selectedBookings.length === 0
          ? t('calendar.noBookingsDay')
          : t('calendar.bookingsDay', { count: selectedBookings.length })}
      </Text>

      {selectedBookings.map((booking) => (
        <View key={booking.id} style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingName} numberOfLines={1}>
              {booking.jobName}
            </Text>
            <Text style={styles.bookingAmount}>
              {formatMoney(booking.amount, booking.currency)}
            </Text>
          </View>
          {booking.location ? (
            <View style={styles.bookingMeta}>
              <MaterialCommunityIcons name="map-marker-outline" size={15} color="#62645c" />
              <Text style={styles.bookingMetaText} numberOfLines={1}>
                {booking.location}
              </Text>
            </View>
          ) : null}
          <View style={[styles.statusPill, booking.completed && styles.statusPillDone]}>
            <Text style={[styles.statusText, booking.completed && styles.statusTextDone]}>
              {booking.completed ? t('status.completed') : t('status.booked')}
            </Text>
          </View>
        </View>
      ))}

      <AppFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#f7f5ef',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    flexGrow: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: '#18201d',
    borderRadius: 8,
    padding: 18,
    marginBottom: 14,
  },
  eyebrow: {
    color: '#9fd8b6',
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
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 14,
    marginBottom: 16,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbfaf6',
  },
  monthLabel: {
    color: '#111',
    fontSize: 17,
    fontWeight: '900',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: '#8a8d84',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 4,
  },
  dayCellSelected: {
    backgroundColor: '#111',
  },
  dayText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
  },
  dayTextToday: {
    textDecorationLine: 'underline',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '900',
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 3,
    backgroundColor: 'transparent',
  },
  dayDotActive: {
    backgroundColor: '#111',
  },
  dayDotSelected: {
    backgroundColor: '#9fd8b6',
  },
  sectionTitle: {
    color: '#111',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 14,
    marginBottom: 10,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bookingName: {
    flex: 1,
    minWidth: 0,
    color: '#111',
    fontSize: 16,
    fontWeight: '900',
  },
  bookingAmount: {
    color: '#111',
    fontSize: 16,
    fontWeight: '900',
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  bookingMetaText: {
    flex: 1,
    color: '#62645c',
    fontWeight: '600',
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#dff4e8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillDone: {
    backgroundColor: '#f1ede4',
  },
  statusText: {
    color: '#24513b',
    fontSize: 12,
    fontWeight: '900',
  },
  statusTextDone: {
    color: '#4d4f49',
  },
  centerState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f5ef',
  },
  mutedText: {
    color: '#63665f',
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default BookingsCalendar;
