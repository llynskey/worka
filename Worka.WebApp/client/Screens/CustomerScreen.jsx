// CustomerScreen.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import JobList from '../components/customer/JobList';
import JobTypeScreen from './JobTypeScreen'; // Ensure this screen is created

const Tab = createBottomTabNavigator();

const JobListScreen = () => {
  return <JobList />;
};

const CustomerScreen = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Job List"
        component={JobListScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Post a Job"
        component={JobTypeScreen} // Changed from JobFormScreen to JobTypeScreen
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default CustomerScreen;