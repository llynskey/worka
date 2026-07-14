import React, { useEffect, useState } from 'react';
import { ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate, formatMoney, resolveUploadUrl } from '../../api/workaApi';
import { requestCurrentLocation } from '../../Utils/locationUtils';
import MapPreview from '../MapPreview';

const WORKA_SERVICE_FEE_RATE = 0.10;
const WORKA_SERVICE_FEE_MINIMUM = 2;

const categoryImages = {
  Plumbing:
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80',
  Electrical:
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80',
  Painting:
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80',
  Cleaning:
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
  Garden:
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
  Repairs:
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
};

const getServiceFee = (price) => {
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.max(WORKA_SERVICE_FEE_MINIMUM, amount * WORKA_SERVICE_FEE_RATE);
};

const statusLabel = (status) => {
  if (status === 1 || String(status).toLowerCase() === 'accepted') return 'Booked';
  if (status === 2 || String(status).toLowerCase() === 'rejected') return 'Closed';
  if (status === 3 || String(status).toLowerCase() === 'completed') return 'Done';
  if (status === 4 || String(status).toLowerCase() === 'cancelled') return 'Closed';
  return 'Open';
};

const JobCard = ({ job, quotes = [], onAcceptQuote, onEditJob, onDeleteJob, onCompleteJob, onReviewJob }) => {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const openDetails = () => {
    setDetailsVisible(true);
    if (!userLocation) {
      // Best-effort: show "x km from you" on the map when the browser allows it.
      requestCurrentLocation().then(setUserLocation).catch(() => {});
    }
  };

  const status = statusLabel(job.jobStatus);
  const acceptedQuote = quotes.find((quote) => quote.quoteId === job.acceptedQuoteId);
  const image = resolveUploadUrl(job.photoUrl) || categoryImages[job.category] || categoryImages.Repairs;
  const acceptedTotal = acceptedQuote
    ? Number(acceptedQuote.price) + getServiceFee(acceptedQuote.price)
    : 0;
  const bestQuote = quotes.reduce((best, quote) => {
    if (!best || Number(quote.price) < Number(best.price)) return quote;
    return best;
  }, null);

  return (
    <>
      <View style={styles.card}>
        <ImageBackground source={{ uri: image }} style={styles.image} imageStyle={styles.imageRadius}>
          <View style={styles.imageOverlay}>
            <Text style={styles.category}>{job.category || 'Home services'}</Text>
            <Text style={styles.date}>{job.photoUrl ? 'Photo attached' : formatDate(job.createdAt)}</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{job.jobName}</Text>
            <View style={[styles.statusPill, status === 'Booked' && styles.statusPillBooked]}>
              <Text style={[styles.statusText, status === 'Booked' && styles.statusTextBooked]}>{status}</Text>
            </View>
          </View>

          <Text style={styles.description}>{job.jobDescription}</Text>

          {!!(job.locationLabel || job.address) && (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={17} color="#64675f" />
              <Text style={styles.metaText}>{job.locationLabel || job.address}</Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.detailsButton} onPress={openDetails}>
              <MaterialCommunityIcons name="file-search-outline" size={18} color="#111" />
              <Text style={styles.detailsButtonText}>View details</Text>
            </TouchableOpacity>
            {bestQuote ? <Text style={styles.bestQuoteText}>Best quote {formatMoney(bestQuote.price)}</Text> : null}
          </View>

          {(status === 'Open' || status === 'Booked' || status === 'Done') && (
            <View style={styles.manageRow}>
              {status === 'Open' ? (
                <>
                  <TouchableOpacity style={styles.manageButton} onPress={() => onEditJob?.(job)}>
                    <MaterialCommunityIcons name="pencil-outline" size={17} color="#111" />
                    <Text style={styles.manageButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.manageButton} onPress={() => onDeleteJob?.(job)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={17} color="#8c2f2f" />
                    <Text style={[styles.manageButtonText, styles.manageButtonDanger]}>Delete</Text>
                  </TouchableOpacity>
                </>
              ) : status === 'Booked' ? (
                <TouchableOpacity style={styles.manageButtonPrimary} onPress={() => onCompleteJob?.(job)}>
                  <MaterialCommunityIcons name="check-circle-outline" size={17} color="#fff" />
                  <Text style={styles.manageButtonPrimaryText}>Mark complete</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.manageButtonPrimary} onPress={() => onReviewJob?.(job)}>
                  <MaterialCommunityIcons name="star-outline" size={17} color="#fff" />
                  <Text style={styles.manageButtonPrimaryText}>Leave a review</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.quoteBlock}>
            <View style={styles.quoteHeader}>
              <Text style={styles.quoteTitle}>{quotes.length} quote{quotes.length === 1 ? '' : 's'}</Text>
              {acceptedQuote && <Text style={styles.acceptedText}>Booked total {formatMoney(acceptedTotal)}</Text>}
            </View>

            {quotes.length === 0 ? (
              <Text style={styles.emptyQuotes}>Quotes from professionals will appear here.</Text>
            ) : (
              quotes.map((quote) => {
                const accepted = quote.quoteId === job.acceptedQuoteId;
                const serviceFee = getServiceFee(quote.price);
                const total = Number(quote.price) + serviceFee;
                return (
                  <View key={quote.quoteId} style={styles.quoteRow}>
                    <View style={styles.quoteCopy}>
                      <Text style={styles.quotePrice}>{formatMoney(quote.price)}</Text>
                      <Text style={styles.quoteDescription}>{quote.description || 'No note provided.'}</Text>
                      <Text style={styles.quoteFee}>
                        Worka fee {formatMoney(serviceFee)}. You pay {formatMoney(total)}. Worker receives {formatMoney(quote.price)}.
                      </Text>
                      <View style={styles.walletRow}>
                        <MaterialCommunityIcons name="apple" size={15} color="#111" />
                        <MaterialCommunityIcons name="google" size={14} color="#111" />
                        <MaterialCommunityIcons name="credit-card-check-outline" size={15} color="#111" />
                        <Text style={styles.walletText}>Apple Pay, Google Pay, Link, or card via Stripe Checkout.</Text>
                      </View>
                    </View>

                    {accepted ? (
                      <View style={styles.acceptedBadge}>
                        <MaterialCommunityIcons name="check" size={16} color="#24513b" />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => onAcceptQuote?.(quote)}
                        disabled={status === 'Booked'}
                      >
                        <MaterialCommunityIcons name="lock-check-outline" size={15} color="#fff" />
                        <Text style={styles.acceptButtonText}>Pay & book</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>
      </View>

      <Modal visible={detailsVisible} transparent animationType="slide" onRequestClose={() => setDetailsVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <ImageBackground source={{ uri: image }} style={styles.modalImage} imageStyle={styles.modalImageRadius}>
                <View style={styles.modalImageOverlay}>
                  <Text style={styles.modalImageLabel}>{job.photoUrl ? 'Customer reference photo' : job.category || 'Job detail'}</Text>
                </View>
              </ImageBackground>

              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalKicker}>{status}</Text>
                  <Text style={styles.modalTitle}>{job.jobName}</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setDetailsVisible(false)}>
                  <MaterialCommunityIcons name="close" size={22} color="#111" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Work needed</Text>
                <Text style={styles.detailText}>{job.jobDescription}</Text>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailTile}>
                  <MaterialCommunityIcons name="shape-outline" size={18} color="#111" />
                  <Text style={styles.detailTileLabel}>Category</Text>
                  <Text style={styles.detailTileValue}>{job.category || 'Home services'}</Text>
                </View>
                <View style={styles.detailTile}>
                  <MaterialCommunityIcons name="calendar-outline" size={18} color="#111" />
                  <Text style={styles.detailTileLabel}>Posted</Text>
                  <Text style={styles.detailTileValue}>{formatDate(job.createdAt)}</Text>
                </View>
              </View>

              {!!(job.locationLabel || job.address) && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <MapPreview
                    latitude={job.latitude}
                    longitude={job.longitude}
                    userLocation={userLocation}
                    locationLabel={job.locationLabel || job.address}
                    height={220}
                  />
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Quotes and payment</Text>
                {quotes.length === 0 ? (
                  <Text style={styles.detailText}>No quotes yet. Once a worker quotes, you can review their note and pay securely in-app.</Text>
                ) : (
                  quotes.map((quote) => {
                    const accepted = quote.quoteId === job.acceptedQuoteId;
                    const serviceFee = getServiceFee(quote.price);
                    const total = Number(quote.price) + serviceFee;
                    return (
                      <View key={`detail-${quote.quoteId}`} style={styles.modalQuoteRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.quotePrice}>{formatMoney(quote.price)}</Text>
                          <Text style={styles.quoteDescription}>{quote.description || 'No note provided.'}</Text>
                          <Text style={styles.quoteFee}>
                            Customer pays {formatMoney(total)}. Worker receives {formatMoney(quote.price)}. Worka earns {formatMoney(serviceFee)}.
                          </Text>
                        </View>
                        {accepted ? (
                          <View style={styles.acceptedBadge}>
                            <MaterialCommunityIcons name="check" size={16} color="#24513b" />
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={() => {
                              setDetailsVisible(false);
                              onAcceptQuote?.(quote);
                            }}
                            disabled={status === 'Booked'}
                          >
                            <Text style={styles.acceptButtonText}>Pay</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
                <View style={styles.securePaymentBox}>
                  <MaterialCommunityIcons name="shield-check-outline" size={18} color="#111" />
                  <Text style={styles.securePaymentText}>
                    Secure checkout supports wallets and cards where enabled in Stripe. Worker payouts are handled through Stripe Connect.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    marginBottom: 14,
  },
  image: {
    height: 136,
    justifyContent: 'flex-end',
  },
  imageRadius: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  imageOverlay: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  category: {
    color: '#fff',
    fontWeight: '900',
  },
  date: {
    color: '#fff',
    fontWeight: '700',
  },
  body: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    flex: 1,
    color: '#111',
    fontSize: 18,
    fontWeight: '900',
  },
  statusPill: {
    backgroundColor: '#f2efe6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillBooked: {
    backgroundColor: '#dff4e8',
  },
  statusText: {
    color: '#4d4f49',
    fontSize: 12,
    fontWeight: '900',
  },
  statusTextBooked: {
    color: '#24513b',
  },
  description: {
    marginTop: 8,
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
    color: '#64675f',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  detailsButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#fff',
  },
  detailsButtonText: {
    color: '#111',
    fontWeight: '900',
  },
  bestQuoteText: {
    flex: 1,
    textAlign: 'right',
    color: '#111',
    fontWeight: '900',
  },
  manageRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  manageButton: {
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
  manageButtonText: {
    color: '#111',
    fontWeight: '800',
  },
  manageButtonDanger: {
    color: '#8c2f2f',
  },
  manageButtonPrimary: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#111',
  },
  manageButtonPrimaryText: {
    color: '#fff',
    fontWeight: '900',
  },
  quoteBlock: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#ece7dc',
    paddingTop: 12,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  quoteTitle: {
    color: '#111',
    fontWeight: '900',
  },
  acceptedText: {
    color: '#24513b',
    fontWeight: '900',
  },
  emptyQuotes: {
    color: '#73766f',
    fontStyle: 'italic',
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1ede4',
  },
  quoteCopy: {
    flex: 1,
  },
  quotePrice: {
    color: '#111',
    fontSize: 17,
    fontWeight: '900',
  },
  quoteDescription: {
    marginTop: 3,
    color: '#64675f',
  },
  quoteFee: {
    marginTop: 5,
    color: '#111',
    fontSize: 12,
    fontWeight: '800',
  },
  walletRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  walletText: {
    flex: 1,
    minWidth: 180,
    color: '#4d504b',
    fontSize: 12,
    fontWeight: '700',
  },
  acceptButton: {
    minHeight: 44,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
  acceptedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dff4e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.46)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '92%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 16,
    paddingBottom: 28,
  },
  modalImage: {
    minHeight: 240,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#f1ede4',
    marginBottom: 14,
  },
  modalImageRadius: {
    borderRadius: 8,
  },
  modalImageOverlay: {
    backgroundColor: 'rgba(0,0,0,0.48)',
    padding: 12,
  },
  modalImageLabel: {
    color: '#fff',
    fontWeight: '900',
  },
  modalHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalKicker: {
    color: '#62645c',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modalTitle: {
    color: '#111',
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  detailSection: {
    borderTopWidth: 1,
    borderTopColor: '#ece7dc',
    paddingTop: 13,
    marginTop: 13,
  },
  detailLabel: {
    color: '#111',
    fontWeight: '900',
    marginBottom: 7,
  },
  detailText: {
    color: '#4d504b',
    lineHeight: 21,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  detailTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fbfaf6',
  },
  detailTileLabel: {
    color: '#62645c',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  detailTileValue: {
    color: '#111',
    fontWeight: '900',
    marginTop: 4,
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  modalQuoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  securePaymentBox: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 9,
    backgroundColor: '#fff',
  },
  securePaymentText: {
    flex: 1,
    color: '#111',
    fontWeight: '800',
    lineHeight: 20,
  },
});

export default JobCard;
