import React from 'react';
import { Platform, SafeAreaView, Text, View } from 'react-native';
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
import LoadingScreen from './Screens/LoadingScreen';

import SharedDrawerContent from './components/SharedDrawerContent';
import { AuthContext, AuthProvider } from './auth/AuthContext';
import { I18nProvider, useI18n } from './i18n/I18nContext';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type CustomerDrawerParamList = {
  Home: undefined;
  Account: undefined;
  Settings: undefined;
  JobType: undefined;
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

const NeutralScreen: React.FC = () => {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text>{t('app.accountTypeNotSet')}</Text>
    </View>
  );
};

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

const CustomerDrawer: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { t } = useI18n();
  return (
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
      <CustomerDrawerScreen
        name="Home"
        component={CustomerScreen}
        options={{ title: t('drawer.customerWorkspace'), drawerLabel: t('drawer.home') }}
      />
      <CustomerDrawerScreen
        name="Account"
        component={CustomerAccountScreen}
        options={{ title: t('drawer.account'), drawerLabel: t('drawer.account') }}
      />
      <CustomerDrawerScreen
        name="Settings"
        component={CustomerSettingsScreen}
        options={{ title: t('drawer.settings'), drawerLabel: t('drawer.settings') }}
      />
      <CustomerDrawerScreen name="JobType" component={JobTypeScreen} options={hiddenDrawerRoute} />
    </CustomerDrawerNavigator>
  );
};

const WorkerDrawer: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { t } = useI18n();
  return (
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
      <WorkerDrawerScreen
        name="Home"
        component={WorkerScreen}
        options={{ title: t('drawer.professionalWorkspace'), drawerLabel: t('drawer.home') }}
      />
      <WorkerDrawerScreen
        name="Account"
        component={WorkerAccountScreen}
        options={{ title: t('drawer.account'), drawerLabel: t('drawer.account') }}
      />
      <WorkerDrawerScreen
        name="Settings"
        component={WorkerSettingsScreen}
        options={{ title: t('drawer.settings'), drawerLabel: t('drawer.settings') }}
      />
    </WorkerDrawerNavigator>
  );
};

const AppInner: React.FC = () => {
  const { user, role, loading, signOut } = React.useContext(AuthContext);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const root = document.getElementById('root');
    const targets = [document.documentElement, document.body, root].filter(Boolean) as HTMLElement[];
    const previous = targets.map((element) => ({
      element,
      height: element.style.height,
      width: element.style.width,
      overflow: element.style.overflow,
      margin: element.style.margin,
    }));

    targets.forEach((element) => {
      element.style.height = '100%';
      element.style.width = '100%';
      element.style.overflow = 'hidden';
      if (element === document.body) {
        element.style.margin = '0';
      }
    });

    return () => {
      previous.forEach(({ element, height, width, overflow, margin }) => {
        element.style.height = height;
        element.style.width = width;
        element.style.overflow = overflow;
        element.style.margin = margin;
      });
    };
  }, []);

  if (loading) return <LoadingScreen />;

  const webViewportStyle =
    Platform.OS === 'web'
      ? ({ height: '100vh', maxHeight: '100vh', overflow: 'hidden' } as any)
      : null;

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: '#fff' }, webViewportStyle]}>
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
  <I18nProvider>
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  </I18nProvider>
);

export default App;
