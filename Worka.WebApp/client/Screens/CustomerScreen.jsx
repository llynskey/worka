import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import JobList from '../components/customer/JobList';
import JobTypeScreen from './JobTypeScreen';

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
    <View style={styles.webShell}>
      <View style={styles.webSidebar}>
        <Text style={styles.webEyebrow}>Customer</Text>
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
        {activeTab === 'jobs' ? (
          <JobList navigation={navigation} />
        ) : (
          <JobTypeScreen navigation={navigation} />
        )}
      </View>
    </View>
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
          const iconName = route.name === 'Job List' ? 'clipboard-list-outline' : 'plus-circle-outline';
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

export default CustomerScreen;
