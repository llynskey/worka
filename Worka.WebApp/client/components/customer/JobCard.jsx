import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate, formatMoney } from '../../api/workaApi';

const WORKA_SERVICE_FEE_RATE = 0.12;
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
  return 'Open';
};

const JobCard = ({ job, quotes = [], onAcceptQuote }) => {
  const status = statusLabel(job.jobStatus);
  const acceptedQuote = quotes.find((quote) => quote.quoteId === job.acceptedQuoteId);
  const image = categoryImages[job.category] || categoryImages.Repairs;
  const acceptedTotal = acceptedQuote
    ? Number(acceptedQuote.price) + getServiceFee(acceptedQuote.price)
    : 0;

  return (
    <View style={styles.card}>
      <ImageBackground source={{ uri: image }} style={styles.image} imageStyle={styles.imageRadius}>
        <View style={styles.imageOverlay}>
          <Text style={styles.category}>{job.category || 'Home services'}</Text>
          <Text style={styles.date}>{formatDate(job.createdAt)}</Text>
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
                      Worka service fee {formatMoney(serviceFee)}. Customer total {formatMoney(total)}.
                    </Text>
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
                      <Text style={styles.acceptButtonText}>Accept quote</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </View>
    </View>
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
  acceptButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
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
});

export default JobCard;
