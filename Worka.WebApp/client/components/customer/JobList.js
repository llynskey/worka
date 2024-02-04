import React from 'react';
import { FlatList, StyleSheet, StatusBar } from 'react-native';
import JobCard from './JobCard'; // Import JobCard component

const JobList = () => {
  const jobs = [
    {
      id: 0,
      title: 'Plumbing Repair',
      description: 'Fix leaky kitchen sink',
      imageUrl: 'https://source.unsplash.com/featured/?plumbing',
      date: '2023-11-15'
    },
    {
      id: 1,
      title: 'Electrical Installation',
      description: 'Install new ceiling lights',
      imageUrl: 'https://source.unsplash.com/featured/?electrical-work',
      date: '2023-11-20'
    },
    // Add more jobs here...
  ];

  return (
    <FlatList
      data={jobs}
      renderItem={({ item }) => <JobCard job={item} />} // Use JobCard for each item
      keyExtractor={item => item.id.toString()}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
});

export default JobList;
