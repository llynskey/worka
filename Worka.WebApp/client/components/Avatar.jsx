import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const Avatar = ({ photoUrl, firstName, lastName, size = 46 }) => {
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={[styles.image, circle]} resizeMode="cover" />;
  }

  const initials = `${(firstName?.[0] ?? '?').toUpperCase()}${(lastName?.[0] ?? '').toUpperCase()}`;

  return (
    <View style={[styles.fallback, circle]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.34) }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#f1ede4',
  },
  fallback: {
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '900',
  },
});

export default Avatar;
