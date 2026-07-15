import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';

/**
 * Slim global footer shown under every signed-in page: quiet legal links
 * and the LSL mark.
 */
const AppFooter = () => {
  const { t } = useI18n();

  return (
    <View style={styles.footer}>
      <View style={styles.links}>
        <TouchableOpacity onPress={() => Linking.openURL('https://worka.site/privacy.html')}>
          <Text style={styles.link}>{t('landing.privacy')}</Text>
        </TouchableOpacity>
        <Text style={styles.dot}>·</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://worka.site/terms.html')}>
          <Text style={styles.link}>{t('landing.terms')}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.mark}>LSL</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e3dfd2',
    backgroundColor: '#f7f5ef',
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  link: {
    color: '#8a8d84',
    fontSize: 11,
    fontWeight: '600',
  },
  dot: {
    color: '#8a8d84',
    fontSize: 11,
  },
  mark: {
    color: '#8a8d84',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
});

export default AppFooter;
