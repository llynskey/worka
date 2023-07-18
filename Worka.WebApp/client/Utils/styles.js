// styles.js
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fffff',
    justifyContent: 'center',
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
    borderBottomWidth: 1,
    width: '75%'
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

  inputIcon: {
    width: '10%',
    padding: 5,
   // marginLeft: 'auto'
  }
});
