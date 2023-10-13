import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppRegistry } from 'react-native';
import AuthScreen from './Screens/AuthScreen';
import RegisterScreen from './Screens/RegisterScreen';
import CustomerScreen from './Screens/CustomerScreen';
import WorkerScreen from './Screens/WorkerScreen';
import SignupScreen from './Screens/Signup';

// Initialize the navigators
const Stack = createStackNavigator();  // <-- You forgot to include this line
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={AuthScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
)
const CustomerTab = createBottomTabNavigator();
const WorkerTab = createBottomTabNavigator();

const App = () => {
  const user = null; // replace this with real authentication logic
  const userType = null; // replace this with real authentication logic

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack/>
      ) : userType === 'customer' ? (
        <CustomerTab.Navigator>
          <CustomerTab.Screen name="Customer" component={CustomerScreen} />
          {/* Add more screens here if necessary */}
        </CustomerTab.Navigator>
      ) : (
        <WorkerTab.Navigator>
          <WorkerTab.Screen name="Worker" component={WorkerScreen} />
          {/* Add more screens here if necessary */}
        </WorkerTab.Navigator>
      )}
    </NavigationContainer>
  );
};

// Register the root component using AppRegistry
AppRegistry.registerComponent('main', () => App);

export default App;
