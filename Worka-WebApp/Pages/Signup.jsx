import { View } from 'react-native'
import React, { Component } from 'react'
import { Text, TextInput, Button } from 'react-native-paper'

export default class Signup extends Component {
  render() {
    return (
      <View>
        <Text>Signup</Text>
        <TextInput placeholder='Firstname'></TextInput>
        <TextInput placeholder='Lastname'></TextInput>
        <TextInput placeholder='Email' autoComplete='email'></TextInput>
        <TextInput placeholder='Username' autoComplete='username'></TextInput>
        <TextInput placeholder='Password' autoComplete='password'></TextInput>

        <Button mode='contained' style={{flex:1, alignContent:'center', justifyContent:'center'}}>Sign up!</Button>
      </View>
    )
  }
}