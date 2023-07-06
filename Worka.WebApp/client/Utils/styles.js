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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 5,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
  },
});
