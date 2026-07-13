import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import JobList from '../components/worker/JobList';
import BidList from '../components/worker/BidList';

const Tab = createBottomTabNavigator();

const WorkerScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === 'Available Jobs' ? 'briefcase-search-outline' : 'file-document-edit-outline';
          return <MaterialCommunityIcons name={iconName} size={size ?? 22} color={color} />;
        },
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
      <Tab.Screen name="My Bids" component={BidList} />
    </Tab.Navigator>
  );
};

export default WorkerScreen;
