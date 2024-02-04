// JobDetailsScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const JobDetailsScreen = ({ navigation, route }) => {
  const { jobType } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const navigateToAddressScreen = () => {
    navigation.navigate('JobAddressScreen', { jobType, title, description });
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Job Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        placeholder="Job Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
      />
      <Button title="Next" onPress={navigateToAddressScreen} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginVertical: 10,
  },
});

export default JobDetailsScreen;
