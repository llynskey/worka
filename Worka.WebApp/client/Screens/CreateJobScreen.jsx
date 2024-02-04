import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

const CreateJobScreen = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    language: ''
  });

  const languages = [
    { label: 'English', value: 'english' },
    { label: 'Spanish', value: 'spanish' },
    { label: 'French', value: 'french' }
    // ... add more languages as needed
  ];

  const handleChangeText = (name, value) => {
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);
  };

  const handleCreateJob = async () => {
    try {
      // Here, you would send the formData to your API to create a new job.
      // axios.post('https://api.worka.cc/create-job', formData);
      console.log('Job created:', formData);
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Job</Text>

      <TextInput
        style={styles.input}
        placeholder="Job Title"
        onChangeText={text => handleChangeText('title', text)}
        value={formData.title}
      />

      <TextInput
        style={styles.input}
        placeholder="Job Description"
        onChangeText={text => handleChangeText('description', text)}
        value={formData.description}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Street"
        onChangeText={text => handleChangeText('street', text)}
        value={formData.street}
      />

      <TextInput
        style={styles.input}
        placeholder="City"
        onChangeText={text => handleChangeText('city', text)}
        value={formData.city}
      />

      <TextInput
        style={styles.input}
        placeholder="State"
        onChangeText={text => handleChangeText('state', text)}
        value={formData.state}
      />

      <TextInput
        style={styles.input}
        placeholder="Postal Code"
        onChangeText={text => handleChangeText('postalCode', text)}
        value={formData.postalCode}
      />

      <TextInput
        style={styles.input}
        placeholder="Country"
        onChangeText={text => handleChangeText('country', text)}
        value={formData.country}
      />

      <DropDownPicker
        items={languages}
        defaultValue={formData.language}
        containerStyle={{ height: 50, width: 250 }}
        onChangeItem={item => handleChangeText('language', item.value)}
      />

      <Button title="Create Job" onPress={handleCreateJob} />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10
  }
});

export default CreateJobScreen;