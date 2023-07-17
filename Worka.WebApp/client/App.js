import React from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, AppRegistry } from 'react-native';
import AuthScreen from './Screens/AuthScreen';
import RegisterScreen from './Screens/RegisterScreen';
import CustomerScreen from './Screens/CustomerScreen';
import WorkerScreen from './Screens/WorkerScreen';
import SignupScreen from './Screens/Signup';

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
    <SafeAreaView>
      <NavigationContainer>
        {!user ? (
          <SignupScreen />
        ) : userType === 'customer' ? (
          <CustomerScreen />
        ) : (
          <WorkerScreen />
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
};

// Register the root component using AppRegistry
AppRegistry.registerComponent('main', () => App);

export default App;
