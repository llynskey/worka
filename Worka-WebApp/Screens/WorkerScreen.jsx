import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import JobList from '../components/worker/JobList';
import BidList from '../components/worker/BidList';

const Tab = createBottomTabNavigator();

const JobListScreen = () => {
  return <JobList />;
};

const BidListScreen = () => {
  return <BidList />;
};

const WorkerScreen = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Available Jobs" component={JobListScreen} />
      <Tab.Screen name="My Bids" component={BidListScreen} />
    </Tab.Navigator>
  );
};

export default WorkerScreen;
