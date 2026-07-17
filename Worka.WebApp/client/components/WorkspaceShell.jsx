import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLayout } from '../Utils/theme';

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
      <Text style={[styles.topBarTitle, isDesktop && styles.topBarTitleInline]} numberOfLines={1}>
        {eyebrow} <Text style={styles.topBarTitleStrong}>{title}</Text>
      </Text>
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
    </View>
  );
};

// Web: the section bar auto-hides once the content is scrolled and slides back in
// at the top of the content or when the cursor reaches the top edge.
const WebShell = ({ eyebrow, title, tabs, activeTab, onTabChange, children }) => {
  const [barH, setBarH] = useState(88);
  const [hidden, setHidden] = useState(false);
  const [hover, setHover] = useState(false);
  const lastY = useRef(0);
  const activeTabRef = useRef(activeTab);
  const visible = hover || !hidden;

  // Show the bar again when switching sections. Also clear the hover latch:
  // clicking a tab leaves the cursor over the bar, and without a mouse move a
  // stuck hover would keep `visible` true and stop the bar ever retracting.
  useEffect(() => {
    activeTabRef.current = activeTab;
    lastY.current = 0;
    setHidden(false);
    setHover(false);
  }, [activeTab]);

  useEffect(() => {
    let raf = 0;
    const onScroll = (e) => {
      const el = e.target;
      if (!el || typeof el.scrollTop !== 'number' || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = el.scrollTop;
        const max = (el.scrollHeight || 0) - (el.clientHeight || 0);
        if (y < 0 || y > max) return; // ignore rubber-band overscroll (bounce)
        const last = lastY.current;
        lastY.current = y;
        // The map view keeps the bar fixed so the map panel never shifts.
        if (activeTabRef.current === 'map') setHidden(false);
        else if (y <= 24) setHidden(false); // at the top
        else if (y > last + 8) {
          setHidden(true); // scrolling down
          setHover(false); // drop any stale hover latch so it can actually hide
        } else if (y < last - 8) setHidden(false); // scrolling up
      });
    };
    // Capture phase so nested screen scrollers are caught (scroll doesn't bubble).
    document.addEventListener('scroll', onScroll, true);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  return (
    <View style={styles.shellColumn}>
      {React.createElement('div', {
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        style: { position: 'absolute', top: 0, left: 0, right: 0, height: 16, zIndex: 30 },
      })}
      {React.createElement(
        'div',
        {
          onMouseEnter: () => setHover(true),
          onMouseLeave: () => setHover(false),
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            transform: `translateY(${visible ? 0 : -(barH + 6)}px)`,
            transition: 'transform 260ms ease',
          },
        },
        <SectionBar
          eyebrow={eyebrow}
          title={title}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onLayout={(e) => setBarH(Math.round(e.nativeEvent.layout.height))}
        />
      )}
      <View
        style={[
          styles.main,
          { paddingTop: visible ? barH : 0, transitionProperty: 'padding-top', transitionDuration: '260ms' },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const WorkspaceShell = (props) => {
  if (Platform.OS === 'web') return <WebShell {...props} />;
  return (
    <View style={styles.shellColumn}>
      <SectionBar {...props} />
      <View style={styles.main}>{props.children}</View>
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
  topBarTitleInline: {
    flexShrink: 1,
    minWidth: 0,
  },
  topTabsScrollDesktop: {
    flexGrow: 0,
    flexShrink: 1,
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
