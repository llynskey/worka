import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Button,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    accountType: null,
  });
  const [hidePassword, setHidePassword] = useState(true);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: 'Customer', value: 0 },
    { label: 'Professional', value: 1 },
  ]);

  const handleChangeText = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handlePasswordVisibility = () => {
    setHidePassword((prevHide) => !prevHide);
  };

  const handleSignUp = async () => {
    try {
      const response = await axios.post('https://api.worka-uk.online/signup', formData);
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
    }
  };

  const renderContent = () => (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', margin: 15 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={30} color="#000" />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Registration</Text>
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="First name"
          placeholderTextColor="#000"
          onChangeText={(text) => handleChangeText('firstname', text)}
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
        <View style={{ marginVertical: open ? 100 : 20 }}>
          <Button title="Create Account" onPress={handleSignUp} color="#000" />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={[{ key: 'content' }]}
        renderItem={renderContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

export default SignupScreen;
