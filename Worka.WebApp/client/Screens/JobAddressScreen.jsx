import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';

const JobAddressScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Address step merged</Text>
      <Text style={styles.text}>The current posting form now collects job address and service details together.</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('JobType')}>
        <Text style={styles.buttonText}>Open post-a-job form</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f7f5ef',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
    marginBottom: 8,
  },
  text: {
    color: '#565951',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
  },
});

export default JobAddressScreen;
