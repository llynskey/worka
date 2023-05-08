import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { Provider as PaperProvider, Button, TextInput } from 'react-native-paper';
import Signup from './Pages/Signup';


export default function App() {
  return (
    <SafeAreaView style={styles.container}>
        <ScrollView>

        <PaperProvider>
          <StatusBar style="auto" />
          <Button icon='camera' mode='contained'>Yo shatup you slag</Button>
          </PaperProvider>
        <Signup/>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      marginTop:StatusBar.currentHeight
  },
  profile: {
      flexDirection: 'row',
      backgroundColor: '#EEE',
  },
  imageProfile: {
      width: 34,
      marginBottom: 5,
      marginTop: 5,
      borderRadius: 44/2,
      marginLeft: 10,
      height: 34
  },
  name: {
      alignSelf: 'center',
      marginLeft: 10,
      fontSize: 16
  }
});