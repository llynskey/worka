import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const JobCard = ({ job }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: job.imageUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title}>{job.title}</Text>
        <Text>{job.description}</Text>
        {/* Add more job details here */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginVertical: 10,
    marginHorizontal: 16,
  },
  image: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  info: {
    padding: 10,
  },
  title: {
    fontWeight: 'bold',
  },
});

export default JobCard;
