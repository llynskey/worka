// LoginForm.js
import React, { useState } from 'react';
import { Text, TextInput, View, Image } from 'react-native';
import { styles } from '../../Utils/styles';
import { Button } from '@rneui/themed';

const LoginForm = () => {
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);

  const login = () => {
    // Replace this with your actual login logic
  };

  return (
    <View style={styles.container}>
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
              onPress={() => console.log('aye')}
            />
    </View>
  );
};

export default LoginForm;
