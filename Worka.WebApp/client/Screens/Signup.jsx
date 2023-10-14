import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Button, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Add this for storing the JWT token
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { styles } from '../Utils/styles';
import jwtDecode from 'jwt-decode';

const SignupScreen = ({ navigation, route }) => {
  const handleLogin = route.params.handleLogin;
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    accountType: null
  });

  const [hidePassword, setHidePassword] = useState(true);

  const handlePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: 'Customer', value: 0 },
    { label: 'Professional', value: 1 }
  ]);

  const handleChangeText = (name, value) => {
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);
  };

  const handleSignUp = async () => {
    try {
      const response = await axios.post('https://api.worka.cc/signup', formData);
  
      // Handle successful registration
      if (response.data && response.data.token) {
        const token = response.data.token;
        await AsyncStorage.setItem('token', token); // Ensure the key 'jwtToken' is consistent across the app
        const tokenData = jwtDecode(token);
        if (tokenData && tokenData.Type) {
          handleLogin(tokenData);  // Use the propagated function here
        }
      }
    } catch (error) {
      console.error(error);
      // Add more specific error handling logic here if needed.
      // For instance, if the server responds with a 400 status (Bad Request),
      // it usually means validation errors which you might want to show to the user.
    }
  };  

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', margin: 15 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={30} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Registration</Text>
          <TextInput
            style={styles.input}
            placeholder="First name"
            placeholderTextColor="#000"
            onChangeText={text => handleChangeText('firstname', text)}
            maxLength={15}
          />
          <TextInput
            style={styles.input}
            placeholder="Last name"
            placeholderTextColor="#000"
            onChangeText={text => handleChangeText('lastname', text)}
            maxLength={20}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#000"
            onChangeText={text => handleChangeText('email', text)}
            keyboardType="email-address"
            maxLength={50}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#000"
              onChangeText={text => handleChangeText('password', text)}
              secureTextEntry={hidePassword}
              maxLength={50}
            />
            <Pressable style={styles.inputIcon} onPress={handlePasswordVisibility}>
              <MaterialCommunityIcons name={hidePassword ? 'eye' : 'eye-off'} size={22} color="#000" />
            </Pressable>
          </View>
          <DropDownPicker
          style={styles.input}
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            setValue={(callback) => {
              const newValue = callback(value);
              setValue(newValue);
              handleChangeText('accountType', newValue);
            }}
            setItems={setItems}
          />
        </View>
        <View style={open ? styles.buttonContainerOpen : styles.buttonContainerClosed}>
          <Button title="Create Account" onPress={handleSignUp} color="#000" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignupScreen;
