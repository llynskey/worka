// JobTypeScreen.js
import React from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';

const jobTypes = [
    { 
      type: 'Plumbing', 
      icon: 'https://via.placeholder.com/150?text=Plumbing' // Placeholder image for Plumbing
    },
    { 
      type: 'Electrical', 
      icon: 'https://via.placeholder.com/150?text=Electrical' // Placeholder image for Electrical
    },
    { 
      type: 'Painting', 
      icon: 'https://via.placeholder.com/150?text=Painting' // Placeholder image for Painting
    },
    { 
      type: 'Construction', 
      icon: 'https://via.placeholder.com/150?text=Construction' // Placeholder image for Construction
    },
  ];
  

const JobTypeScreen = ({ navigation }) => {
  const selectJobType = (type) => {
    navigation.navigate('JobDetailsScreen', { jobType: type });
  };

  return (
    <View style={styles.container}>
      {jobTypes.map((job, index) => (
        <TouchableOpacity key={index} style={styles.iconButton} onPress={() => selectJobType(job.type)}>
          <Image source={job.icon} style={styles.icon} />
          <Text>{job.type}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    margin: 10,
  },
  icon: {
    width: 100,
    height: 100,
  },
});

export default JobTypeScreen;
