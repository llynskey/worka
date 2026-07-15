import React, { useState } from 'react';
import { ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../../api/workaApi';
import { useI18n } from '../../i18n/I18nContext';
import { categoryLabel } from '../../i18n/categories';
import MapPreview from '../MapPreview';
import PhotoLightbox from '../PhotoLightbox';

const JobDetailsModal = ({ job, image, userLocation = null, onClose, onQuote }) => {
  const { t } = useI18n();
  const [lightboxUri, setLightboxUri] = useState(null);

  return (
  <Modal visible={!!job} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View style={styles.card}>
        {job ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('jobs.details')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={onClose}
              >
                <MaterialCommunityIcons name="close" size={22} color="#111" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={() => setLightboxUri(image)}>
              <ImageBackground source={{ uri: image }} style={styles.photo} imageStyle={styles.photoRadius}>
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoText}>
                    {job.photoUrl ? t('jobs.referencePhotoTap') : categoryLabel(t, job.category)}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <Text style={styles.jobName}>{job.jobName}</Text>
            <Text style={styles.meta}>
              {categoryLabel(t, job.category)} - {t('jobs.postedDate', { date: formatDate(job.createdAt) })}
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('jobs.workNeeded')}</Text>
              <Text style={styles.description}>{job.jobDescription}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('jobs.location')}</Text>
              <MapPreview
                latitude={job.latitude}
                longitude={job.longitude}
                userLocation={userLocation}
                locationLabel={job.locationLabel || job.address}
                height={200}
              />
            </View>

            <TouchableOpacity
              style={styles.quoteButton}
              onPress={() => {
                onClose?.();
                onQuote?.(job);
              }}
            >
              <MaterialCommunityIcons name="cash-plus" size={20} color="#fff" />
              <Text style={styles.quoteButtonText}>{t('quotes.sendA')}</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : null}
      </View>
    </View>

    <PhotoLightbox
      uri={lightboxUri}
      label={job?.jobName}
      onClose={() => setLightboxUri(null)}
    />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#111',
    fontSize: 22,
    fontWeight: '900',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1ede4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#f1ede4',
    marginBottom: 12,
  },
  photoRadius: {
    borderRadius: 8,
  },
  photoOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 11,
  },
  photoText: {
    color: '#fff',
    fontWeight: '900',
  },
  jobName: {
    color: '#111',
    fontSize: 22,
    fontWeight: '900',
  },
  meta: {
    color: '#62645c',
    fontWeight: '700',
    marginTop: 4,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: '#ece7dc',
    paddingTop: 13,
    marginTop: 13,
  },
  sectionLabel: {
    color: '#111',
    fontWeight: '900',
    marginBottom: 8,
  },
  description: {
    color: '#4d504b',
    lineHeight: 21,
  },
  quoteButton: {
    minHeight: 48,
    backgroundColor: '#111',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  quoteButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
});

export default JobDetailsModal;
