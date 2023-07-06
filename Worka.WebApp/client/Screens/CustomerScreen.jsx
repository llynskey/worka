import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import JobList from '../components/customer/JobList';
import WorkerMap from '../components/customer/workerMap';

const Tab = createBottomTabNavigator();

const WorkerMapScreen = () => {
  return <WorkerMap/>;
};

const JobListScreen = () => {
  return <JobList/>;
};

const CustomerScreen = () => {
  return (
    <WorkerMapScreen/>
  );
};

export default CustomerScreen;
