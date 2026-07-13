import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';

import AuthScreen from './Screens/AuthScreen';
import SignupScreen from './Screens/SignupScreen';
import CustomerScreen from './Screens/CustomerScreen';
import WorkerScreen from './Screens/WorkerScreen';
import CustomerSettingsScreen from './Screens/CustomerSettingsScreen';
import CustomerAccountScreen from './Screens/CustomerAccountScreen';
import WorkerSettingsScreen from './Screens/WorkerSettingsScreen';
import WorkerAccountScreen from './Screens/WorkerAccountScreen';
import JobTypeScreen from './Screens/JobTypeScreen';
import JobDetailsScreen from './Screens/JobDetailsScreen';
import JobAddressScreen from './Screens/JobAddressScreen';
import LoadingScreen from './Screens/LoadingScreen';

import SharedDrawerContent from './components/SharedDrawerContent';
import { AuthContext, AuthProvider } from './auth/AuthContext';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type CustomerDrawerParamList = {
  Home: undefined;
  Account: undefined;
  Settings: undefined;
  JobType: undefined;
  JobDetails: undefined;
  JobAddress: undefined;
};

export type WorkerDrawerParamList = {
  Home: undefined;
  Account: undefined;
  Settings: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const CustomerDrawerNav = createDrawerNavigator<CustomerDrawerParamList>();
const WorkerDrawerNav = createDrawerNavigator<WorkerDrawerParamList>();

const StackNavigator = RootStack.Navigator as unknown as React.ComponentType<any>;
const StackScreen = RootStack.Screen as unknown as React.ComponentType<any>;
const CustomerDrawerNavigator = CustomerDrawerNav.Navigator as unknown as React.ComponentType<any>;
const CustomerDrawerScreen = CustomerDrawerNav.Screen as unknown as React.ComponentType<any>;
const WorkerDrawerNavigator = WorkerDrawerNav.Navigator as unknown as React.ComponentType<any>;
const WorkerDrawerScreen = WorkerDrawerNav.Screen as unknown as React.ComponentType<any>;

const NeutralScreen: React.FC = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <Text>Account type not set. Please contact Worka support.</Text>
  </View>
);

const AuthStack: React.FC = () => (
  <StackNavigator screenOptions={{ headerShown: false }}>
    <StackScreen name="Login" component={AuthScreen} />
    <StackScreen name="Signup" component={SignupScreen} />
  </StackNavigator>
);

const hiddenDrawerRoute = {
  drawerItemStyle: { display: 'none' },
  headerShown: false,
};

const CustomerDrawer: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <CustomerDrawerNavigator
    initialRouteName="Home"
    drawerContent={(props: DrawerContentComponentProps) => (
      <SharedDrawerContent {...props} userType="Customer" logoutHandler={onLogout} />
    )}
    screenOptions={{
      swipeEnabled: false,
      headerShown: true,
      headerTitle: 'Worka',
    }}
  >
    <CustomerDrawerScreen name="Home" component={CustomerScreen} options={{ title: 'Customer workspace' }} />
    <CustomerDrawerScreen name="Account" component={CustomerAccountScreen} />
    <CustomerDrawerScreen name="Settings" component={CustomerSettingsScreen} />
    <CustomerDrawerScreen name="JobType" component={JobTypeScreen} options={hiddenDrawerRoute} />
    <CustomerDrawerScreen name="JobDetails" component={JobDetailsScreen} options={hiddenDrawerRoute} />
    <CustomerDrawerScreen name="JobAddress" component={JobAddressScreen} options={hiddenDrawerRoute} />
  </CustomerDrawerNavigator>
);

const WorkerDrawer: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <WorkerDrawerNavigator
    initialRouteName="Home"
    drawerContent={(props: DrawerContentComponentProps) => (
      <SharedDrawerContent {...props} userType="Professional" logoutHandler={onLogout} />
    )}
    screenOptions={{
      swipeEnabled: false,
      headerShown: true,
      headerTitle: 'Worka Pro',
    }}
  >
    <WorkerDrawerScreen name="Home" component={WorkerScreen} options={{ title: 'Professional workspace' }} />
    <WorkerDrawerScreen name="Account" component={WorkerAccountScreen} />
    <WorkerDrawerScreen name="Settings" component={WorkerSettingsScreen} />
  </WorkerDrawerNavigator>
);

const AppInner: React.FC = () => {
  const { user, role, loading, signOut } = React.useContext(AuthContext);

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <NavigationContainer theme={DefaultTheme}>
        {!user ? (
          <AuthStack />
        ) : role === 'customer' ? (
          <CustomerDrawer onLogout={signOut} />
        ) : role === 'professional' ? (
          <WorkerDrawer onLogout={signOut} />
        ) : (
          <NeutralScreen />
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default App;
