import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator size="large" color="#111" />
      <Text style={styles.text}>Opening Worka...</Text>
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
