import React, { useState } from 'react';
import {
  Text,
  TextInput,
  View,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { styles } from '../Utils/styles';
import { Button } from '@rneui/themed';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

const AuthScreen = ({ navigation, route }) => {
  const handleLogin = route.params.handleLogin;
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);

  const navigateToSignup = () => {
    navigation.navigate('Signup');
  };

  const login = async () => {
    try {
      const response = await axios.post("https://api.worka.cc/login", {
        email,
        password
      });
      if (response.data && response.data.token) {
        const token = response.data.token;
        await AsyncStorage.setItem('token', token);
        const tokenData = jwtDecode(token);
        if (tokenData && tokenData.Type) {
          handleLogin(tokenData);
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Login failed. Please check your credentials.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View >
          <Image source={require('../assets/logo.png')} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            onChangeText={setEmail}
            value={email}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            onChangeText={setPassword}
            value={password}
            secureTextEntry
          />
          <Button
            title="Log in"
            loading={false}
            loadingProps={{ size: 'small', color: 'white' }}
            buttonStyle={{
              backgroundColor: 'rgba(39, 39, 39, 1)',
              borderRadius: 5,
            }}
            titleStyle={{ fontWeight: 'bold', fontSize: 23 }}
            containerStyle={{
              marginHorizontal: 50,
              height: 50,
              marginVertical: 10,
            }}
            onPress={login}
          />
          <Button
            title="Sign Up"
            loading={false}
            loadingProps={{ size: 'small', color: 'white' }}
            buttonStyle={{
              backgroundColor: 'rgba(39, 39, 39, 1)',
              borderRadius: 5,
            }}
            titleStyle={{ fontWeight: 'bold', fontSize: 23 }}
            containerStyle={{
              marginHorizontal: 50,
              height: 50,
              marginVertical: 10,
            }}
            onPress={navigateToSignup}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;
