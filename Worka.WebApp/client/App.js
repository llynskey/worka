import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppRegistry } from 'react-native';
import AuthScreen from './Screens/AuthScreen';
import RegisterScreen from './Screens/RegisterScreen';
import CustomerScreen from './Screens/CustomerScreen';
import WorkerScreen from './Screens/WorkerScreen';
import SignupScreen from './Screens/Signup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

// Initialize the navigators
const Stack = createStackNavigator();
const AuthStack = ({handleLogin}) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={AuthScreen} initialParams={{ handleLogin: handleLogin }}/>
    <Stack.Screen name="Signup" component={SignupScreen} initialParams={{ handleLogin: handleLogin }}/>
  </Stack.Navigator>
)
const CustomerTab = createBottomTabNavigator();
const WorkerTab = createBottomTabNavigator();

const App = () => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        setUser(decoded);
        setUserType(decoded.Type);
      }
    };
    checkToken();
  }, []);

  const handleLogin = (decodedUser) => {
    setUser(decodedUser);
  };

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack handleLogin={handleLogin}/>  // Pass the function down
      ) : user.Type === 'customer' ? (
        <CustomerTab.Navigator>
          <CustomerTab.Screen name="CustomerScreen" component={CustomerScreen} />
        </CustomerTab.Navigator>
      ) : (
        <WorkerTab.Navigator>
          <WorkerTab.Screen name="WorkerScreen" component={WorkerScreen} />
        </WorkerTab.Navigator>
      )}
    </NavigationContainer>
  );
};

// Register the root component using AppRegistry
AppRegistry.registerComponent('main', () => App);

export default App;
