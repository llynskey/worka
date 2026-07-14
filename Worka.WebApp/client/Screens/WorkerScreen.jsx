import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import JobList from '../components/worker/JobList';
import BidList from '../components/worker/BidList';
import JobMap from '../components/worker/JobMap';

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
];

const WorkerWebWorkspace = () => {
  const [activeTab, setActiveTab] = useState('jobs');

  return (
    <View style={styles.webShell}>
      <View style={styles.webSidebar}>
        <Text style={styles.webEyebrow}>Professional</Text>
        <Text style={styles.webTitle}>Workspace</Text>

        <View style={styles.webNav}>
          {webTabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.webNavItem, active && styles.webNavItemActive]}
              >
                <MaterialCommunityIcons name={tab.icon} size={22} color={active ? '#fff' : '#111'} />
                <View style={styles.webNavText}>
                  <Text style={[styles.webNavLabel, active && styles.webNavLabelActive]}>{tab.label}</Text>
                  <Text style={[styles.webNavDescription, active && styles.webNavDescriptionActive]}>
                    {tab.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.webMain}>
        {activeTab === 'jobs' ? <JobList /> : activeTab === 'map' ? <JobMap /> : <BidList />}
      </View>
    </View>
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
      <Tab.Screen name="Map" component={JobMap} />
      <Tab.Screen name="My Bids" component={BidList} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  webShell: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    backgroundColor: '#f7f5ef',
  },
  webSidebar: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: '#dedad0',
    backgroundColor: '#fff',
    padding: 22,
  },
  webEyebrow: {
    color: '#666',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  webTitle: {
    color: '#111',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 24,
  },
  webNav: {
    gap: 10,
  },
  webNavItem: {
    minHeight: 74,
    borderWidth: 1,
    borderColor: '#dedad0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
  },
  webNavItemActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  webNavText: {
    flex: 1,
  },
  webNavLabel: {
    color: '#111',
    fontWeight: '900',
    fontSize: 15,
  },
  webNavLabelActive: {
    color: '#fff',
  },
  webNavDescription: {
    color: '#666',
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
  },
  webNavDescriptionActive: {
    color: '#ddd',
  },
  webMain: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
});

export default WorkerScreen;
