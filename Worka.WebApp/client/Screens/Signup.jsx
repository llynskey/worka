import React, {Component} from 'react';
import View from 'react-native-ui-lib/view';
import Text from 'react-native-ui-lib/text';
import Button from 'react-native-ui-lib/button';
import TextField from 'react-native-ui-lib/textField';
import axios from 'axios';
//import {TextField, Text, Button} from 'react-native-ui-lib';

class SignupScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      firstname: '',
      lastname: '',
      email: '',
      password: ''
    };
  }

  handleChangeText = (fieldName, value) => {
    this.setState({ [fieldName]: value });
  }

  handleSignUp = async () => {
    // Access the stored values
    const { firstname, lastname, email, password } = this.state;
    //import {TextField, Text, Button} from 'react-native-ui-lib';

    console.log(this.state);
    try {
      // Send POST request to the server
      const response = await axios.post('https://localhost:5001/signup', {
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
      <View marginT-100 center>
        <Text 
          color='#006DAA' 
          text20 
          >Create Account
        </Text>
          <TextField
            placeholder={'firstname'}
            onChangeText={(text) => this.handleChangeText('firstname', text)}
            enableErrors
            validate={['required', (value) => value.length > 1]}
            validationMessage={['First name is required']}
            maxLength={15}
          />
        <TextField
          placeholder={'lastname'}
          onChangeText={(text) => this.handleChangeText('lastname', text)}
          enableErrors
          validate={['required', (value) => value.length > 1]}
          validationMessage={['Last name is required']}
          maxLength={20}
        />
        <TextField
          placeholder={'email'}
          onChangeText={(text) => this.handleChangeText('email', text)}
          enableErrors
          keyboardType="email-address"
          inputMode="email"
          validate={['required', (value) => value.length > 1]}
          validationMessage={['Email is required']}
          maxLength={50}
        />
        <TextField
          placeholder={'password'}
          onChangeText={(text) => this.handleChangeText('password', text)}
          enableErrors
          keyboardType="visible-password"
          secureTextEntry
          validate={['required', (value) => value.length > 1]}
          validationMessage={['Password is required']}
          maxLength={50}
        />
        <View marginT-100 center>
          <Button 
            text70 
            white 
            backgroundColor="#061A40" 
            label="Create Account"
            onPress={this.handleSignUp}
          />
        </View>
      </View>
    );
  }
}

/*  <TextField text50 placeholder="username" grey10/>
        <TextField text50 placeholder="password" secureTextEntry grey10/>*/

        /*<ValidatableInput
          field='firstname'
          type='letter'
          value={ this.state.firstname }
          handleChange={ handleInputChange }
        />
        <ValidatableInput
          field='lastname'
          type='letter'
          value={ this.state.lastname }
          handleChange={ handleInputChange }
        />
        <ValidatableInput
          field='email'
          type='email'
          value={ this.state.email }
          handleChange={ handleInputChange }
        />
        <ValidatableInput
          field='password'
          type='password'
          value={ this.state.password }
          handleChange={ handleInputChange }
        />
         <Button link text70 orange30 label="Sign Up" marginT-20/>
        */

export default SignupScreen;