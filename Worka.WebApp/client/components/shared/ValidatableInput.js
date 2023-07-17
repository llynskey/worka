import React from 'react';
import { StyleSheet } from 'react-native'
// import { TextInput } from 'react-native-paper'
import { TextField } from 'react-native-ui-lib'

var isValid = true;
var error = "";

const ValidatableInput = (props) => {
  const { field, type, value, updateInputChange } = props;

  console.log("props:", props);
  const validateInput = (text) => {
    console.log("values", type, text);

    switch(type)
    {
      case 'letters':
      {
        if (!value.match(/^[a-zA-Z]+$/)) {
          isValid = false;
          error = "Must contain only letters";
        }
        break;
      }
  
      case 'email':
      {
        let lastAtPos = value.lastIndexOf("@");
        let lastDotPos = value.lastIndexOf(".");
  
        if (
          !(
            lastAtPos < lastDotPos &&
            lastAtPos > 0 &&
            value.indexOf("@@") == -1 &&
            lastDotPos > 2 &&
            value.length - lastDotPos > 2
          )
        ) {
          error = "Invalid Email";
        }
        break;
      }
  
      case 'password':
      {
        // Check if the password length is greater than 8 characters
        if (value.length < 8) 
        {
          error = "Password should be at least 8 characters long";
        }
        // Check if the password contains at least one digit
        if (!/\d/.test(value)) {
          error = "Password should contain at least one digit";
        }
        // Check if the password contains at least one special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          error = "Password should contain at least one special character";
        }
        break;
      }
    }
      // Return is valud on the object so that they can't submit?
      updateInputChange(field, text);
  }

  return (
    <TextField
          placeholder={field}
          grey10
          enableErrors
          validate={'required'}
          validationMessage={error}
          onChangeText={(text) => validateInput(text)}
    />
  );
};

export default ValidatableInput;
