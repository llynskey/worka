import React, {Component} from 'react';
import View from 'react-native-ui-lib/view';
import Text from 'react-native-ui-lib/text';
import Button from 'react-native-ui-lib/button';
import TextField from 'react-native-ui-lib/textField';
import axios from 'axios';
import { Pressable } from 'react-native';
import { styles } from '../Utils/styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';

class SignupScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      hidePassword: true,
      passwordVisibilityIcon: 'eye'
    };
  }

  // Function to handle the toggle for showing the inputted password
  handlePasswordVisibility = () => {
    if (this.state.passwordVisibilityIcon === 'eye') {
      this.setState({ ['passwordVisibilityIcon']: 'eye-off' });
      this.setState({['hidePassword']: true});
    } else if (this.state.passwordVisibilityIcon === 'eye-off') {
      this.setState({ ['passwordVisibilityIcon']: 'eye' });
      this.setState({ ['hidePassword']: false});      
    }
  };

  handleChangeText = (fieldName, value) => {
    this.setState({ [fieldName]: value });
  }

  validateInput = async () => {

  }
  
  handleSignUp = async () => {
    // Access the stored values
    const { firstname, lastname, email, password } = this.state;

    try {
      // Send signup request
      const response = await axios.post('https://localhost:5001/signup', {
        firstname,
        lastname,
        email,
        password
      });

    } catch (error) {
      // Handle error
      console.error(error);
    }
  }

  render() {
    return (
      <View marginT-50>
        <Text 
          color='#1e1e1e' 
          text20 
          style={styles.title}
          >Registration
        </Text>
        <View style={styles.inputContainer}>
          <TextField
            placeholder={'First name'}
            floatingPlaceholder
            onChangeText={(text) => this.handleChangeText('firstname', text)}
            enableErrors
            validate={['required', (value) => value.length > 1]}
            validationMessage={['First name is required']}
            maxLength={15}
            style={styles.input}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextField
            placeholder={'Last name'}
            floatingPlaceholder
            onChangeText={(text) => this.handleChangeText('lastname', text)}
            enableErrors
            validate={['required', (value) => value.length > 1]}
            validationMessage={['Last name is required']}
            maxLength={20}
            style={styles.input}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextField
            placeholder={'Email'}
            floatingPlaceholder
            onChangeText={(text) => this.handleChangeText('email', text)}
            enableErrors
            keyboardType="email-address"
            inputMode="email"
            validate={['required', (value) => value.length > 1]}
            validationMessage={['Email is required']}
            maxLength={50}
            style={styles.input}
          />
        </View>
        <View style={styles.inputContainerWithIcon}>
          <TextField
            placeholder={'Password'}
            floatingPlaceholder
            onChangeText={(text) => this.handleChangeText('password', text)}
            enableErrors
            secureTextEntry={this.state.hidePassword}
            validate={['required', (value) => value.length > 1]}
            validationMessage={['Password is required']}
            maxLength={50}
            style={styles.inputWithIcon}
          />
          <Pressable onPress={this.handlePasswordVisibility} style={styles.inputIcon}>
            <MaterialCommunityIcons name={this.state.passwordVisibilityIcon} size={22} color="#232323" />
          </Pressable>
        </View>
        <View marginT-25 center>
          <Button
            text70 
            white 
            backgroundColor="#1e1e1e" 
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