import React, { useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import JobList from '../components/customer/JobList';
import ProDirectory from '../components/customer/ProDirectory';
import JobTypeScreen from './JobTypeScreen';
import WorkspaceShell from '../components/WorkspaceShell';

const Tab = createBottomTabNavigator();

const webTabs = [
  {
    key: 'jobs',
    label: 'Jobs',
    icon: 'clipboard-list-outline',
    description: 'Track posted work and quotes',
  },
  {
    key: 'post',
    label: 'Post a job',
    icon: 'plus-circle-outline',
    description: 'Create a new request',
  },
  {
    key: 'pros',
    label: 'Find pros',
    icon: 'account-search-outline',
    description: 'Browse and filter professionals',
  },
];

const createWebNavigation = (setActiveTab) => ({
  navigate: (routeName) => {
    if (routeName === 'Post a Job' || routeName === 'JobType' || routeName === 'post') {
      setActiveTab('post');
      return;
    }

    setActiveTab('jobs');
  },
});

const CustomerWebWorkspace = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const navigation = useMemo(() => createWebNavigation(setActiveTab), []);

  return (
    <WorkspaceShell
      eyebrow="Customer"
      title="Workspace"
      tabs={webTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'jobs' ? (
        <JobList navigation={navigation} />
      ) : activeTab === 'post' ? (
        <JobTypeScreen navigation={navigation} />
      ) : (
        <ProDirectory />
      )}
    </WorkspaceShell>
  );
};

const CustomerScreen = () => {
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
      <Tab.Screen name="Job List" component={JobList} />
      <Tab.Screen name="Post a Job" component={JobTypeScreen} />
      <Tab.Screen name="Find Pros" component={ProDirectory} />
    </Tab.Navigator>
  );
};

export default CustomerScreen;
