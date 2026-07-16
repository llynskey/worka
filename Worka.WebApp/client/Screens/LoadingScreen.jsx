import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import Logo from '../components/Logo';

const LoadingScreen = () => {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <Logo height={52} style={styles.logo} />
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
    backgroundColor: '#fff',
    padding: 24,
  },
  logo: {
    marginBottom: 20,
  },
  text: {
    marginTop: 12,
    color: '#565951',
    fontWeight: '800',
  },
});

export default LoadingScreen;
