import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Native fallback — the interactive Mapbox GL map is web-only. A full native map
// would use @rnmapbox/maps; until then, native shows a prompt to open a job.
const JobsMapView = ({ style }) => (
  <View style={[styles.fallback, style]}>
    <MaterialCommunityIcons name="map-outline" size={30} color="#111" />
    <Text style={styles.text}>Open a job to see its location and directions.</Text>
  </View>
);

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fbfaf6',
  },
  text: { color: '#62645c', marginTop: 8, textAlign: 'center', lineHeight: 20 },
});

export default JobsMapView;
