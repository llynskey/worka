import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Button, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { styles } from '../Utils/styles';

const SignupScreen = ({navigation}) => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    accountType: null
  });

  const [selectedValue, setSelectedValue] = useState(null);

  const [hidePassword, setHidePassword] = useState(true);

  const handlePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };

  const handleChangeText = (name, value) => {
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSignUp = async () => {
    try {
      const response = await axios.post('https://api.worka.cc/signup', formData);
      // Handle successful registration
    } catch (error) {
      console.error(error);
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
<View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.accountType}
              onValueChange={value => handleChangeText('accountType', value)}
            >
              {formData.accountType === 'placeholder' && <Picker.Item label="Select Account Type" value="placeholder" />}
              <Picker.Item label="Customer" value="0" />
              <Picker.Item label="Professional" value="1" />
            </Picker>
          </View>
</View>
      <Button title="Create Account" onPress={handleSignUp} color="#000" />
    </ScrollView>
    </SafeAreaView>
  );
};

export default SignupScreen;
