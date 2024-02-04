import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const NeutralScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text>Welcome to the App!</Text>
      <Button
        title="Go to Login"
        onPress={() => navigation.navigate('Login')}
      />
      <Button
        title="Go to Signup"
        onPress={() => navigation.navigate('Signup')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
});

export default NeutralScreen;
