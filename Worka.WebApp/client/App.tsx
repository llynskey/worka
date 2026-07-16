import React from 'react';
import { Image, Platform, SafeAreaView, Text, View, useWindowDimensions } from 'react-native';
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
import NotifyHost from './components/NotifyHost';
import { AuthContext, AuthProvider } from './auth/AuthContext';
import { I18nProvider, useI18n } from './i18n/I18nContext';

// Wordmark in the navbar instead of plain text.
const HeaderLogo: React.FC<{ badge?: string }> = ({ badge }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Image
      source={require('./assets/logo.png')}
      style={{ width: 96, height: 26 }}
      resizeMode="contain"
      accessibilityLabel="Fixa"
    />
    {badge ? (
      <Text
        style={{
          color: '#62645c',
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {badge}
      </Text>
    ) : null}
  </View>
);

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
        headerTitle: () => <HeaderLogo />,
        drawerStyle: { width: 300, backgroundColor: '#fff', borderRightColor: '#ece7dc', borderRightWidth: 1 },
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
        headerTitle: () => <HeaderLogo badge={t('drawer.professionalBadge')} />,
        drawerStyle: { width: 300, backgroundColor: '#fff', borderRightColor: '#ece7dc', borderRightWidth: 1 },
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
  const { height: windowHeight } = useWindowDimensions();

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
      position: element.style.position,
      inset: element.style.inset,
    }));

    targets.forEach((element) => {
      element.style.height = '100%';
      element.style.width = '100%';
      element.style.overflow = 'hidden';
      if (element === document.body) {
        element.style.margin = '0';
        // iOS Safari ignores overflow:hidden for touch panning — a fixed,
        // viewport-pinned body is the only reliable way to stop the page
        // being dragged sideways. All scrolling happens inside the app's
        // own ScrollViews, so pinning the body loses nothing.
        element.style.position = 'fixed';
        element.style.inset = '0';
      }
    });

    return () => {
      previous.forEach(({ element, height, width, overflow, margin, position, inset }) => {
        element.style.height = height;
        element.style.width = width;
        element.style.overflow = overflow;
        element.style.margin = margin;
        element.style.position = position;
        element.style.inset = inset;
      });
    };
  }, []);

  if (loading) return <LoadingScreen />;

  // Use the measured window height rather than 100vh: on iPhone Safari,
  // 100vh includes the zone behind the floating address bar, which used to
  // hide the footer. useWindowDimensions tracks the *visible* viewport and
  // updates when the toolbar collapses/expands.
  const webViewportStyle =
    Platform.OS === 'web'
      ? ({ height: windowHeight, maxHeight: windowHeight, overflow: 'hidden' } as any)
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
      <NotifyHost />
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
