import React from 'react';
import { FlatList, Text, View } from 'react-native';

const JobList = () => {
  const jobs = []; // Replace this with actual jobs data

  return (
    <FlatList
      data={jobs}
      renderItem={({ item }) => (
        <View>
          <Text>{item.title}</Text>
          <Text>{item.description}</Text>
        </View>
      )}
      keyExtractor={item => item.id}
    />
  );
};

export default JobList;
