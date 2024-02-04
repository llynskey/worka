// WorkerSettingsScreen.js
import React from 'react';
import { View, Text, Button } from 'react-native';

const WorkerSettingsScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Worker Settings Screen</Text>
      <Button title="Go to Account" onPress={() => navigation.navigate('Account')} />
    </View>
  );
};

export default WorkerSettingsScreen;
