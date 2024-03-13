import React, { useState, useEffect } from 'react';
import { View, Image, SafeAreaView, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
// Screens
import AuthScreen from './Screens/AuthScreen';
import SignupScreen from './Screens/SignupScreen';
import CustomerScreen from './Screens/CustomerScreen';
import WorkerScreen from './Screens/WorkerScreen';
import CustomerSettingsScreen from './Screens/CustomerSettingsScreen';
import CustomerAccountScreen from './Screens/CustomerAccountScreen';
import WorkerSettingsScreen from './Screens/WorkerSettingsScreen';
import WorkerAccountScreen from './Screens/WorkerAccountScreen';
import JobTypeScreen from './Screens/JobTypeScreen.jsx';
import JobDetailsScreen from './Screens/JobDetailsScreen';
import JobAddressScreen from './Screens/JobAddressScreen';
// Components
import SharedDrawerContent from './components/SharedDrawerContent';
import LoadingScreen from './Screens/LoadingScreen';
// Utilities
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import logo from './assets/logo.png';
import styles from './Utils/styles';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUser(decoded);
        } catch (error) {
          console.error('Token decoding error:', error);
          await AsyncStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };
    checkToken();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  const handleLogin = (decodedUser) => {
    setUser(decodedUser);
  };

  const isCustomer = user && user.Type === 'customer';
  const isWorker = user && user.Type === 'worker';

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={styles.container}>
        <NavigationContainer>
          {!user ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={AuthScreen} initialParams={{ handleLogin: handleLogin }} />
              <Stack.Screen name="Signup" component={SignupScreen} initialParams={{ handleLogin: handleLogin }} />
            </Stack.Navigator>
          ) : isCustomer ? (
            <Drawer.Navigator
              drawerContent={(props) => <SharedDrawerContent {...props} userType="Customer" logoutHandler={handleLogout} />}
              screenOptions={{ swipeEnabled: false, headerShown: true }}
            >
              <Drawer.Screen name="Home" component={CustomerScreen} />
              <Drawer.Screen name="Account" component={CustomerAccountScreen} />
              <Drawer.Screen name="Settings" component={CustomerSettingsScreen} />
              <Drawer.Screen name="JobType" component={JobTypeScreen} />
              <Drawer.Screen name="JobDetails" component={JobDetailsScreen} />
              <Drawer.Screen name="JobAddress" component={JobAddressScreen} />
            </Drawer.Navigator>
          ) : isWorker ? (
            <Drawer.Navigator
              drawerContent={(props) => <SharedDrawerContent {...props} userType="Worker" logoutHandler={handleLogout} />}
              screenOptions={{ swipeEnabled: false, headerShown: false }}
            >
              <Drawer.Screen name="Home" component={WorkerScreen} />
              <Drawer.Screen name="Account" component={WorkerAccountScreen} />
              <Drawer.Screen name="Settings" component={WorkerSettingsScreen} />
              {/* Add Job Creation screens if applicable to workers */}
            </Drawer.Navigator>
          ) : (
            // Optional: A neutral screen if user type is neither customer nor worker
            <NeutralScreen /> // Replace with a neutral screen component if needed
          )}
        </NavigationContainer>
      </View>
    </SafeAreaView>
  );
};

export default App;
