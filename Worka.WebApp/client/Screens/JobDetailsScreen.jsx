import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const detailItems = [
  {
    icon: 'image-outline',
    title: 'Photos',
    text: 'Add a reference image so workers can understand the job before quoting.',
  },
  {
    icon: 'map-marker-check-outline',
    title: 'Verified location',
    text: 'Choose an address lookup result so distance and map views work cleanly.',
  },
  {
    icon: 'cash-check',
    title: 'Quote-ready brief',
    text: 'Describe access, materials, timing, and anything that could affect the final price.',
  },
];

const JobDetailsScreen = ({ navigation }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="clipboard-text-search-outline" size={36} color="#111" />
        <Text style={styles.title}>Create a complete job brief.</Text>
        <Text style={styles.text}>
          Worka now collects category, description, photo, verified address, and map coordinates in one posting flow.
        </Text>
      </View>

      <View style={styles.detailGrid}>
        {detailItems.map((item) => (
          <View key={item.title} style={styles.detailCard}>
            <MaterialCommunityIcons name={item.icon} size={24} color="#111" />
            <Text style={styles.detailTitle}>{item.title}</Text>
            <Text style={styles.detailText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('JobType')}>
        <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>Post a job</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 96,
    backgroundColor: '#f7f5ef',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 18,
    marginBottom: 14,
  },
  title: {
    color: '#111',
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
    marginTop: 12,
  },
  text: {
    color: '#565951',
    lineHeight: 22,
    marginTop: 8,
  },
  detailGrid: {
    gap: 10,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 14,
  },
  detailTitle: {
    color: '#111',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 9,
  },
  detailText: {
    color: '#565951',
    lineHeight: 20,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
  },
});

export default JobDetailsScreen;
