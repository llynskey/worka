import React from 'react';
import { FlatList, Text, View, StyleSheet, StatusBar } from 'react-native';

const JobList = () => {
  const jobs = [{id: 0, title: 'Job1', description: 'descrip'}]; // Replace this with actual jobs data
  const Item = ({title}) => (
    <View style={styles.item}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
  return (
    <FlatList
        data={jobs}
        renderItem={({item}) => <Item title={item.title} />}
        keyExtractor={item => item.id}
      />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
});

export default JobList;
