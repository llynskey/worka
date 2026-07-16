import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';

/**
 * Slim footer rendered at the very bottom of each page's scrollable
 * content (not pinned): quiet legal links and the LSL mark.
 */
const AppFooter = () => {
  const { t } = useI18n();

  return (
    // marginTop 'auto' pushes the footer to the bottom of the viewport on
    // short pages (the scroll container must have flexGrow: 1); on long
    // pages it simply follows the content.
    <View style={styles.wrap}>
      <View style={styles.footer}>
        <View style={styles.links}>
          <TouchableOpacity onPress={() => Linking.openURL('https://fixa.site/privacy.html')}>
            <Text style={styles.link}>{t('landing.privacy')}</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://fixa.site/terms.html')}>
            <Text style={styles.link}>{t('landing.terms')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.mark}>LSL</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 'auto',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 14,
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: '#e3dfd2',
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
