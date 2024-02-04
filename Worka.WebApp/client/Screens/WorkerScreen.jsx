import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import JobList from '../components/worker/JobList';
import BidList from '../components/worker/BidList';
import WorkerMap from './WorkerMap';

const Tab = createBottomTabNavigator();

const JobListScreen = () => {
  return <WorkerMap />;
};

const BidListScreen = () => {
  return <BidList />;
};

const WorkerScreen = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Available Jobs" 
      component={JobListScreen} 
      options={{ headerShown: false }}
      />
      <Tab.Screen name="My Bids" 
      component={BidListScreen} 
      options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default WorkerScreen;
