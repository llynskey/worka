import React, { useState } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import JobList from '../components/worker/JobList';
import BidList from '../components/worker/BidList';
import JobMap from '../components/worker/JobMap';
import BookingsCalendar from '../components/worker/BookingsCalendar';
import WorkspaceShell from '../components/WorkspaceShell';

const Tab = createBottomTabNavigator();

const webTabs = [
  {
    key: 'jobs',
    label: 'Available jobs',
    icon: 'briefcase-search-outline',
    description: 'Find work to quote',
  },
  {
    key: 'map',
    label: 'Map',
    icon: 'map-marker-radius-outline',
    description: 'Browse jobs by location',
  },
  {
    key: 'bids',
    label: 'My bids',
    icon: 'file-document-edit-outline',
    description: 'Track sent quotes',
  },
  {
    key: 'calendar',
    label: 'Calendar',
    icon: 'calendar-month-outline',
    description: 'Your booked work',
  },
];

const tabIcons = {
  'Available Jobs': 'briefcase-search-outline',
  Map: 'map-marker-radius-outline',
  'My Bids': 'file-document-edit-outline',
  Calendar: 'calendar-month-outline',
};

const WorkerWebWorkspace = () => {
  const [activeTab, setActiveTab] = useState('jobs');

  return (
    <WorkspaceShell
      eyebrow="Professional"
      title="Workspace"
      tabs={webTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'jobs' ? (
        <JobList />
      ) : activeTab === 'map' ? (
        <JobMap />
      ) : activeTab === 'bids' ? (
        <BidList />
      ) : (
        <BookingsCalendar />
      )}
    </WorkspaceShell>
  );
};

const WorkerScreen = () => {
  if (Platform.OS === 'web') {
    return <WorkerWebWorkspace />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={tabIcons[route.name] ?? 'briefcase-search-outline'}
            size={size ?? 22}
            color={color}
          />
        ),
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#777',
        tabBarLabelStyle: { fontWeight: '800', fontSize: 13 },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e3dfd2',
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
        },
      })}
    >
      <Tab.Screen name="Available Jobs" component={JobList} />
      <Tab.Screen name="Map" component={JobMap} />
      <Tab.Screen name="My Bids" component={BidList} />
      <Tab.Screen name="Calendar" component={BookingsCalendar} />
    </Tab.Navigator>
  );
};

export default WorkerScreen;
