// styles.js
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({


  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center'
  },
  logo: {
    padding: 50,
    width: 250,
    height: 50,
    marginTop: 200,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    color: '#ff',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 15,
    marginVertical: 12,
    borderRadius: 10,
    height: 50,  // Explicitly set the height
  },
  
  passwordInput: {
    flex: 1,
    padding: 15,
    marginVertical: 12,
    borderRadius: 10,
    height: 50,  // Explicitly set the height
  },
  

  inputContainer: {
    height: 40,
    width: '80%',
    marginLeft: 35,
    marginBottom:15,
    // borderWidth: 0.5
  },

  inputContainerWithIcon: {
    height: 40,
    width: '80%',
    marginLeft: 35,
    marginBottom:15,
    //display: 'flex',
    //alignItems: 'stretch',
    //flexDirection: 'row'
    //borderWidth: 2
  },

  inputWithIcon: {
   //  padding: 10,
   borderBottomWidth: 1,
   width: '65%',
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    marginVertical: 12,
    borderRadius: 10,
    height: 50,  // Explicitly set the height
  },  

  inputIcon: {
    width: '15%',
    padding: 5,
   // marginLeft: 'auto'
  },
  formContainer: {
    paddingHorizontal: 20,  // Adding horizontal padding
    paddingBottom: 20,  // Optional, if you want bottom padding
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: '#000',
    marginVertical: 12,
    borderRadius: 10,
  },
  
});

