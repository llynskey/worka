import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, formatDate, formatMoney, getErrorMessage, unwrap } from '../../api/workaApi';
import Avatar from '../Avatar';
import Stars from '../Stars';
import { languageLabel } from '../../i18n/spokenLanguages';

const parseLanguages = (value) =>
  String(value ?? '')
    .split(',')
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);

const ProDetailModal = ({ pro, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  const professionalId = pro?.professionalId;

  useEffect(() => {
    if (!professionalId) return;
    let cancelled = false;

    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError('');
        setReviews([]);
        const response = await api.get(`/api/Professionals/${professionalId}/reviews`);
        if (!cancelled) setReviews(unwrap(response.data) ?? []);
      } catch (err) {
        if (!cancelled) setReviewsError(getErrorMessage(err, 'Unable to load reviews.'));
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [professionalId]);

  return (
    <Modal visible={!!pro} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {pro ? (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.headerRow}>
                <Avatar photoUrl={pro.photoUrl} firstName={pro.firstName} lastName={pro.lastName} size={64} />
                <View style={styles.headerCopy}>
                  <Text style={styles.name}>
                    {pro.firstName} {pro.lastName}
                  </Text>
                  <Text style={styles.specialty}>{pro.specialty || 'General home services'}</Text>
                  <View style={styles.starsRow}>
                    <Stars value={pro.averageRating} count={pro.reviewCount} />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={onClose}
                >
                  <MaterialCommunityIcons name="close" size={22} color="#111" />
                </TouchableOpacity>
              </View>

              {pro.readyForPayments ? (
                <View style={styles.payoutPill}>
                  <MaterialCommunityIcons name="shield-check-outline" size={14} color="#24513b" />
                  <Text style={styles.payoutText}>Payout ready</Text>
                </View>
              ) : null}

              {pro.languages ? (
                <View style={styles.langRow}>
                  {parseLanguages(pro.languages).map((code) => (
                    <View key={code} style={styles.langChip}>
                      <Text style={styles.langChipText}>{languageLabel(code)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {pro.bio ? <Text style={styles.bio}>{pro.bio}</Text> : null}

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{pro.quoteCount}</Text>
                  <Text style={styles.statLabel}>Quotes sent</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {pro.averageQuotePrice != null ? formatMoney(pro.averageQuotePrice) : '—'}
                  </Text>
                  <Text style={styles.statLabel}>Avg price</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {pro.minQuotePrice != null ? formatMoney(pro.minQuotePrice) : '—'}
                  </Text>
                  <Text style={styles.statLabel}>From</Text>
                </View>
              </View>

              <View style={styles.reviewsSection}>
                <Text style={styles.reviewsTitle}>Reviews</Text>
                {reviewsLoading ? (
                  <View style={styles.reviewsLoading}>
                    <ActivityIndicator color="#111" />
                  </View>
                ) : reviewsError ? (
                  <Text style={styles.reviewsMuted}>{reviewsError}</Text>
                ) : reviews.length === 0 ? (
                  <Text style={styles.reviewsMuted}>No reviews yet - be the first to book them.</Text>
                ) : (
                  reviews.map((review) => (
                    <View key={review.reviewId} style={styles.reviewRow}>
                      <Stars value={review.rating} />
                      <Text style={styles.reviewComment}>{review.comment || 'No comment left.'}</Text>
                      <Text style={styles.reviewMeta}>
                        {review.reviewerFirstName} - {review.jobName} - {formatDate(review.createdAt)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  card: {
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  content: {
    padding: 18,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: '#111',
    fontSize: 22,
    fontWeight: '900',
  },
  specialty: {
    color: '#62645c',
    fontWeight: '700',
    marginTop: 3,
  },
  starsRow: {
    marginTop: 6,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1ede4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dff4e8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 12,
  },
  payoutText: {
    color: '#24513b',
    fontSize: 12,
    fontWeight: '900',
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  langChip: {
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fbfaf6',
  },
  langChipText: {
    color: '#62645c',
    fontSize: 12,
    fontWeight: '800',
  },
  bio: {
    color: '#4d504b',
    lineHeight: 21,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
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
  reviewsSection: {
    borderTopWidth: 1,
    borderTopColor: '#ece7dc',
    paddingTop: 13,
    marginTop: 16,
  },
  reviewsTitle: {
    color: '#111',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },
  reviewsLoading: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  reviewsMuted: {
    color: '#62645c',
    lineHeight: 20,
  },
  reviewRow: {
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  reviewComment: {
    color: '#4d504b',
    lineHeight: 20,
    marginTop: 7,
  },
  reviewMeta: {
    color: '#62645c',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
});

export default ProDetailModal;
