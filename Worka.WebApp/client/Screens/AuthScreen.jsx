import React from 'react';
import { View, Text } from 'react-native';
import LoginForm from '../components/auth/LoginForm';

const AuthScreen = () => {
  return (
    <View>
      <Text>Login Screen</Text>
      <LoginForm />
    </View>
  );
};

export default AuthScreen;
