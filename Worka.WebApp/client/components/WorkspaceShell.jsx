import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLayout } from '../Utils/theme';
import NotificationCenter from './NotificationCenter';

/**
 * Responsive web workspace shell.
 * Wide viewports: fixed sidebar navigation on the left.
 * Narrow viewports: horizontal tab bar across the top.
 */
// The pill-tab section bar shown across the top.
const SectionBar = ({ eyebrow, title, tabs, activeTab, onTabChange, onLayout }) => {
  const { isDesktop } = useLayout();
  return (
    <View style={[styles.topBar, isDesktop && styles.topBarRow]} onLayout={onLayout}>
      <View style={styles.topBarTitleWrap}>
        <Text style={[styles.topBarTitle, isDesktop && styles.topBarTitleInline]} numberOfLines={1}>
          {eyebrow} <Text style={styles.topBarTitleStrong}>{title}</Text>
        </Text>
        {!isDesktop ? <NotificationCenter /> : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={isDesktop ? styles.topTabsScrollDesktop : undefined}
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
      {isDesktop ? <NotificationCenter /> : null}
    </View>
  );
};

// The section bar stays static at the top of the workspace. An earlier
// auto-hide-on-scroll version was removed: with a shared shell above per-screen
// scrollers it couldn't collapse without reflowing content mid-scroll (jerky),
// and its document-wide scroll listener also reacted to modal scrolling and
// rubber-band overscroll (spasming). A static, compact bar is the robust choice.
const WorkspaceShell = (props) => (
  <View style={styles.shellColumn}>
    <SectionBar {...props} />
    <View style={styles.main}>{props.children}</View>
  </View>
);

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
    borderBottomColor: '#e3dfd2',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  // Desktop: title and pills share one compact row instead of stacking, so the
  // bar doesn't form a tall second header above each page's hero.
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  topBarTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  topBarTitleInline: {
    flexShrink: 1,
    minWidth: 0,
  },
  topTabsScrollDesktop: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  topBarTitle: {
    color: '#666',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    flexShrink: 1,
    minWidth: 0,
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
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e3dfd2',
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
    borderRightColor: '#e3dfd2',
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
    borderColor: '#e3dfd2',
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
