// LoginForm.js
import React, { useState } from 'react';
import { TextInput, Text, View, Image } from 'react-native';
import { useUser } from './UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../../Utils/styles';

const LoginForm = () => {
  const { setUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = () => {
    // Replace this with your actual login logic
    setUser({ email });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Worka</Text>
      <Image style={styles.logo} source={require('../../assets/logo.png')} /> 
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={text => setEmail(text)}
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        onChangeText={text => setPassword(text)}
        value={password}
        secureTextEntry
      />
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.button}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Button style={styles.buttonText}>Login</Button>
      </LinearGradient>
    </View>
  );
};

export default LoginForm;
