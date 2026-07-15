import React, { useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import JobList from '../components/worker/JobList';
import BidList from '../components/worker/BidList';
import JobMap from '../components/worker/JobMap';
import BookingsCalendar from '../components/worker/BookingsCalendar';
import WorkspaceShell from '../components/WorkspaceShell';
import { useI18n } from '../i18n/I18nContext';

const Tab = createBottomTabNavigator();

// Stable keys/icons; labels + descriptions resolve through t() at render time.
const webTabs = [
  {
    key: 'jobs',
    labelKey: 'tabs.available',
    icon: 'briefcase-search-outline',
    descriptionKey: 'tabs.availableDesc',
  },
  {
    key: 'map',
    labelKey: 'tabs.map',
    icon: 'map-marker-radius-outline',
    descriptionKey: 'tabs.mapDesc',
  },
  {
    key: 'bids',
    labelKey: 'tabs.bids',
    icon: 'file-document-edit-outline',
    descriptionKey: 'tabs.bidsDesc',
  },
  {
    key: 'calendar',
    labelKey: 'tabs.calendar',
    icon: 'calendar-month-outline',
    descriptionKey: 'tabs.calendarDesc',
  },
];

const tabIcons = {
  'Available Jobs': 'briefcase-search-outline',
  Map: 'map-marker-radius-outline',
  'My Bids': 'file-document-edit-outline',
  Calendar: 'calendar-month-outline',
};

const WorkerWebWorkspace = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('jobs');
  const tabs = useMemo(
    () =>
      webTabs.map((tab) => ({
        ...tab,
        label: t(tab.labelKey),
        description: t(tab.descriptionKey),
      })),
    [t]
  );

  return (
    <WorkspaceShell
      eyebrow={t('workspace.professional')}
      title={t('workspace.title')}
      tabs={tabs}
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
  const { t } = useI18n();

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
      <Tab.Screen
        name="Available Jobs"
        component={JobList}
        options={{ title: t('tabs.available'), tabBarLabel: t('tabs.available') }}
      />
      <Tab.Screen
        name="Map"
        component={JobMap}
        options={{ title: t('tabs.map'), tabBarLabel: t('tabs.map') }}
      />
      <Tab.Screen
        name="My Bids"
        component={BidList}
        options={{ title: t('tabs.bids'), tabBarLabel: t('tabs.bids') }}
      />
      <Tab.Screen
        name="Calendar"
        component={BookingsCalendar}
        options={{ title: t('tabs.calendar'), tabBarLabel: t('tabs.calendar') }}
      />
    </Tab.Navigator>
  );
};

export default WorkerScreen;
