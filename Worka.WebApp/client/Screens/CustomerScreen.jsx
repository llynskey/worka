import React, { useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import JobList from '../components/customer/JobList';
import ProDirectory from '../components/customer/ProDirectory';
import MessagesInbox from '../components/MessagesInbox';
import JobTypeScreen from './JobTypeScreen';
import WorkspaceShell from '../components/WorkspaceShell';
import { useI18n } from '../i18n/I18nContext';

const Tab = createBottomTabNavigator();

// Stable keys/icons; labels + descriptions resolve through t() at render time.
const webTabs = [
  {
    key: 'jobs',
    labelKey: 'tabs.jobs',
    icon: 'clipboard-list-outline',
    descriptionKey: 'tabs.jobsDesc',
  },
  {
    key: 'post',
    labelKey: 'tabs.post',
    icon: 'plus-circle-outline',
    descriptionKey: 'tabs.postDesc',
  },
  {
    key: 'pros',
    labelKey: 'tabs.pros',
    icon: 'account-search-outline',
    descriptionKey: 'tabs.prosDesc',
  },
  {
    key: 'messages',
    labelKey: 'tabs.messages',
    icon: 'message-text-outline',
    descriptionKey: 'tabs.messagesDesc',
  },
];

const createWebNavigation = (setActiveTab) => ({
  navigate: (routeName) => {
    if (routeName === 'Post a Job' || routeName === 'JobType' || routeName === 'post') {
      setActiveTab('post');
      return;
    }
    if (routeName === 'Find Pros' || routeName === 'pros') {
      setActiveTab('pros');
      return;
    }
    if (routeName === 'Messages' || routeName === 'messages') {
      setActiveTab('messages');
      return;
    }

    setActiveTab('jobs');
  },
});

const CustomerWebWorkspace = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('jobs');
  const navigation = useMemo(() => createWebNavigation(setActiveTab), []);
  const tabs = useMemo(
    () =>
      webTabs.map((tab) => ({
        ...tab,
        label: t(tab.labelKey),
        description: t(tab.descriptionKey),
      })),
    [t]
  );

  return (
    <WorkspaceShell
      eyebrow={t('workspace.customer')}
      title={t('workspace.title')}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'jobs' ? (
        <JobList navigation={navigation} />
      ) : activeTab === 'post' ? (
        <JobTypeScreen navigation={navigation} />
      ) : activeTab === 'messages' ? (
        <MessagesInbox role="customer" />
      ) : (
        <ProDirectory />
      )}
    </WorkspaceShell>
  );
};

const CustomerScreen = () => {
  const { t } = useI18n();

  if (Platform.OS === 'web') {
    return <CustomerWebWorkspace />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Job List'
              ? 'clipboard-list-outline'
              : route.name === 'Find Pros'
                ? 'account-search-outline'
                : route.name === 'Messages'
                  ? 'message-text-outline'
                  : 'plus-circle-outline';
          return <MaterialCommunityIcons name={iconName} size={size ?? 22} color={color} />;
        },
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#777',
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '800',
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e3dfd2',
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
          elevation: 0,
        },
      })}
    >
      <Tab.Screen
        name="Job List"
        component={JobList}
        options={{ title: t('tabs.jobs'), tabBarLabel: t('tabs.jobs') }}
      />
      <Tab.Screen
        name="Post a Job"
        component={JobTypeScreen}
        options={{ title: t('tabs.post'), tabBarLabel: t('tabs.post') }}
      />
      <Tab.Screen
        name="Find Pros"
        component={ProDirectory}
        options={{ title: t('tabs.pros'), tabBarLabel: t('tabs.pros') }}
      />
      <Tab.Screen
        name="Messages"
        options={{ title: t('tabs.messages'), tabBarLabel: t('tabs.messages') }}
      >
        {() => <MessagesInbox role="customer" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default CustomerScreen;
