// CustomerSettingsScreen.js
import React from 'react';
import { View, Text, Button } from 'react-native';

const CustomerSettingsScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Customer Settings Screen</Text>
      <Button title="Go to Account" onPress={() => navigation.navigate('Account')} />
    </View>
  );
};

export default CustomerSettingsScreen;
