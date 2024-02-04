// JobAddressScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Picker, StyleSheet } from 'react-native';

const JobAddressScreen = ({ navigation, route }) => {
  const { jobType, title, description } = route.params;
  const [address, setAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const previousAddresses = ['123 Main St', '456 Elm St'];

  const submitJob = () => {
    // Handle job submission with selected or new address
    // Example: console.log({ jobType, title, description, address: selectedAddress || address });
  };

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedAddress}
        onValueChange={(itemValue) => setSelectedAddress(itemValue)}
      >
        {previousAddresses.map((addr, index) => (
          <Picker.Item key={index} label={addr} value={addr} />
        ))}
      </Picker>
      <TextInput
        placeholder="New Address"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
      />
      <Button title="Submit Job" onPress={submitJob} />
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

export default JobAddressScreen;
