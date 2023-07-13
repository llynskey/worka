import { View } from 'react-native'
import React, { Component } from 'react'
import { Text, TextInput, Button } from 'react-native-paper'
import axios from 'axios';

class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      firstname: '',
      lastname: '',
      email: '',
      password: ''
    };
  }

  handleInputChange = (fieldName, value) => {
    this.setState({ [fieldName]: value });
  }

  handleSignUp = async () => {
    // Access the stored values
    const { firstname, lastname, email, password } = this.state;

    try {
      // Send POST request to the server
      const response = await axios.post('https://worka.cc/signup', {
        firstname,
        lastname,
        email,
        password
      });

      // Handle response from the server
      console.log(response.data); // For example, log the response data
    } catch (error) {
      // Handle error
      console.error(error);
    }
  }

  render() {
    return (
      <View>
        <Text>Signup</Text>
        <TextInput
          placeholder='Firstname'
          value={this.state.firstname}
          onChangeText={(value) => this.handleInputChange('firstname', value)}
        />
        <TextInput
          placeholder='Lastname'
          value={this.state.lastname}
          onChangeText={(value) => this.handleInputChange('lastname', value)}
        />
        <TextInput
          placeholder='Email'
          autoCompleteType='email'
          value={this.state.email}
          onChangeText={(value) => this.handleInputChange('email', value)}
        />
        <TextInput
          placeholder='Password'
          autoCompleteType='password'
          secureTextEntry
          value={this.state.password}
          onChangeText={(value) => this.handleInputChange('password', value)}
        />

        <Button
          mode='contained'
          style={{alignItems: 'center', justifyContent: 'center' }}
          onPress={this.handleSignUp}
        >
          Sign up
        </Button>
      </View>
    )
  }
}

export default Signup;