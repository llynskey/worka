import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SIDEBAR_BREAKPOINT = 900;

/**
 * Responsive web workspace shell.
 * Wide viewports: fixed sidebar navigation on the left.
 * Narrow viewports: horizontal tab bar across the top.
 */
const WorkspaceShell = ({ eyebrow, title, tabs, activeTab, onTabChange, children }) => {
  const { width } = useWindowDimensions();
  const compact = width < SIDEBAR_BREAKPOINT;

  if (compact) {
    return (
      <View style={styles.shellColumn}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>
            {eyebrow} <Text style={styles.topBarTitleStrong}>{title}</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topTabs}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => onTabChange(tab.key)}
                  style={[styles.topTab, active && styles.topTabActive]}
                >
                  <MaterialCommunityIcons name={tab.icon} size={18} color={active ? '#fff' : '#111'} />
                  <Text style={[styles.topTabLabel, active && styles.topTabLabelActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View style={styles.main}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.shellRow}>
      <View style={styles.sidebar}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.nav}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onTabChange(tab.key)}
                style={[styles.navItem, active && styles.navItemActive]}
              >
                <MaterialCommunityIcons name={tab.icon} size={22} color={active ? '#fff' : '#111'} />
                <View style={styles.navText}>
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
                  <Text style={[styles.navDescription, active && styles.navDescriptionActive]}>
                    {tab.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.main}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  shellRow: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    backgroundColor: '#f7f5ef',
  },
  shellColumn: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#f7f5ef',
  },
  topBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dedad0',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  topBarTitle: {
    color: '#666',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  topBarTitleStrong: {
    color: '#111',
  },
  topTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  topTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#dedad0',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  topTabActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  topTabLabel: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
  },
  topTabLabelActive: {
    color: '#fff',
  },
  sidebar: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: '#dedad0',
    backgroundColor: '#fff',
    padding: 22,
  },
  eyebrow: {
    color: '#666',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: '#111',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 24,
  },
  nav: {
    gap: 10,
  },
  navItem: {
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
  navItemActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  navText: {
    flex: 1,
  },
  navLabel: {
    color: '#111',
    fontWeight: '900',
    fontSize: 15,
  },
  navLabelActive: {
    color: '#fff',
  },
  navDescription: {
    color: '#666',
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
  },
  navDescriptionActive: {
    color: '#ddd',
  },
  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
});

export default WorkspaceShell;
