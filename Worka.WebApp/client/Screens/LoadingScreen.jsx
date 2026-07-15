import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';

const LoadingScreen = () => {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator size="large" color="#111" />
      <Text style={styles.text}>{t('app.opening')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f5ef',
    padding: 24,
  },
  logo: {
    width: 160,
    height: 80,
    marginBottom: 20,
  },
  text: {
    marginTop: 12,
    color: '#565951',
    fontWeight: '800',
  },
});

export default LoadingScreen;
