import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import JobList from '../components/customer/JobList';
import JobForm from '../components/customer/JobForm';

const Tab = createBottomTabNavigator();

const JobListScreen = () => {
  return <JobList />;
};

const JobFormScreen = () => {
  return <JobForm />;
};

const CustomerScreen = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Job List" component={JobListScreen} />
      <Tab.Screen name="Post a Job" component={JobFormScreen} />
    </Tab.Navigator>
  );
};

export default CustomerScreen;
