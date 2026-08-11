import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useI18n } from '../i18n/I18nContext';

/**
 * Dismissible first-run explainer shown at the top of each workspace's home
 * screen. `variant` picks the copy ('customer' | 'worker'); dismissal is
 * remembered per-variant on the device so it never nags again.
 */
const IntroCard = ({ variant }) => {
  const { t } = useI18n();
  const storageKey = `worku.introSeen.${variant}`;
  // Start hidden until AsyncStorage answers, so returning users never see
  // the card flash in before it's dismissed.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then((seen) => {
        if (!cancelled && !seen) setVisible(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(storageKey, '1').catch(() => {});
  };

  if (!visible) return null;

  const steps =
    variant === 'worker'
      ? [t('intro.workerStep1'), t('intro.workerStep2'), t('intro.workerStep3')]
      : [t('intro.customerStep1'), t('intro.customerStep2'), t('intro.customerStep3')];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="lightbulb-on-outline" size={22} color="#111" />
        <Text style={styles.title}>
          {variant === 'worker' ? t('intro.workerTitle') : t('intro.customerTitle')}
        </Text>
      </View>

      {steps.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.dismissButton} onPress={dismiss}>
        <MaterialCommunityIcons name="check" size={18} color="#fff" />
        <Text style={styles.dismissText}>{t('intro.gotIt')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    padding: 16,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    color: '#111',
    fontSize: 17,
    fontWeight: '900',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1ede4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumber: {
    color: '#111',
    fontWeight: '900',
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    color: '#3f423c',
    lineHeight: 20,
  },
  dismissButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  dismissText: {
    color: '#fff',
    fontWeight: '900',
  },
});

export default IntroCard;
