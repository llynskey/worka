import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import AuthScreen from './Screens/AuthScreen';
import RegisterScreen from './Screens/RegisterScreen';
import CustomerScreen from './Screens/CustomerScreen';
import WorkerScreen from './Screens/WorkerScreen';

// Initialize the navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Login" component={AuthScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const CustomerTab = () => (
  <Tab.Navigator>
    {CustomerScreen}
  </Tab.Navigator>
);

const WorkerTab = () => (
  <Tab.Navigator>
    {WorkerScreen}
  </Tab.Navigator>
);

// Decide which navigator to show based on whether the user is logged in,
// and what type of user they are
const App = () => {
  const user = null; // replace this with real authentication logic
  const userType = null; // replace this with real authentication logic

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : userType === 'customer' ? (
        <CustomerTab />
      ) : (
        <WorkerTab />
      )}
    </NavigationContainer>
  );
};

export default App;
