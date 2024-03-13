// styles.js
import { StyleSheet, StatusBar } from 'react-native';

const styles = StyleSheet.create({
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

  header: {
    width: '100%',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff', // Standard grey background
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff', // Standard grey background for form
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 1,
    backgroundColor: '#ffffff', // Standard grey background for picker
  },

pickerContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    height: 50,
},

picker: {
    flex: 1,
},
buttonContainerOpen: {
  marginTop: 80, // Adjust based on the expected height of your dropdown
},
buttonContainerClosed: {
  marginTop: 20,  // Default margin top for the button
},

  
});

export default styles;

