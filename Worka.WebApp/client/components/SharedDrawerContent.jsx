import React, { useContext, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, getErrorMessage } from '../api/workaApi';
import notify from '../Utils/notify';
import { AuthContext } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import Logo from './Logo';

// Icon per navigable route; keeps the nav list visual and scannable.
const ROUTE_ICONS = {
  Home: 'view-dashboard-outline',
  Account: 'account-circle-outline',
  Settings: 'cog-outline',
};

export default function SharedDrawerContent(props) {
  const { logoutHandler, userType, state, navigation, descriptors } = props;
  const { t } = useI18n();
  const { signInWithToken } = useContext(AuthContext);
  const [switching, setSwitching] = useState(false);

  const isCustomer = userType === 'Customer';

  // Airbnb-style: one account, two workspaces. The API flips the account
  // type, guarantees the matching profile exists, and returns a fresh
  // token whose role claim drives which workspace renders.
  const switchMode = async () => {
    try {
      setSwitching(true);
      const response = await api.post('/account/switchMode');
      const token = response?.data?.token;
      if (!token) {
        notify(t('common.tryAgain'), getErrorMessage(null, ''));
        return;
      }
      await signInWithToken(token);
    } catch (error) {
      notify(t('common.tryAgain'), getErrorMessage(error));
    } finally {
      setSwitching(false);
    }
  };

  // Build the visible nav list ourselves (instead of DrawerItemList) so each
  // row carries an icon and a considered active state. Hidden routes (e.g.
  // JobType) opt out via drawerItemStyle: { display: 'none' }.
  const navItems = (state?.routes ?? [])
    .map((route, index) => ({ route, index, options: descriptors[route.key]?.options ?? {} }))
    .filter(({ options }) => options.drawerItemStyle?.display !== 'none');

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScroll}>
      <View style={styles.drawerContainer}>
        <View style={styles.brandBlock}>
          <Logo height={34} />
          <View style={styles.workspaceRow}>
            <View style={styles.workspaceDot} />
            <Text style={styles.workspaceLabel}>
              {isCustomer ? t('drawer.customerWorkspace') : t('drawer.professionalWorkspace')}
            </Text>
          </View>
        </View>

        <View style={styles.nav}>
          {navItems.map(({ route, index }) => {
            const { options } = descriptors[route.key];
            const label = options.drawerLabel ?? options.title ?? route.name;
            const active = state.index === index;
            const icon = ROUTE_ICONS[route.name] ?? 'circle-small';
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => navigation.navigate(route.name)}
                style={({ pressed }) => [
                  styles.navItem,
                  active && styles.navItemActive,
                  pressed && styles.navItemPressed,
                ]}
              >
                <View style={[styles.navIcon, active && styles.navIconActive]}>
                  <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={active ? '#fff' : '#62645c'}
                  />
                </View>
                <Text style={[styles.navLabel, active && styles.navLabelActive]} numberOfLines={1}>
                  {label}
                </Text>
                {active ? <View style={styles.navActiveBar} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.switchButton, pressed && styles.switchButtonPressed]}
            onPress={switchMode}
            disabled={switching}
          >
            {switching ? (
              <ActivityIndicator color="#111" />
            ) : (
              <>
                <View style={styles.switchIcon}>
                  <MaterialCommunityIcons name="swap-horizontal" size={18} color="#111" />
                </View>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchText}>
                    {isCustomer ? t('drawer.switchToProfessional') : t('drawer.switchToCustomer')}
                  </Text>
                  <Text style={styles.switchHint} numberOfLines={2}>
                    {t('drawer.switchHint')}
                  </Text>
                </View>
              </>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
            onPress={logoutHandler}
          >
            <MaterialCommunityIcons name="logout" size={19} color="#fff" />
            <Text style={styles.logoutText}>{t('drawer.logout')}</Text>
          </Pressable>

          <Text style={styles.legalText}>LSL</Text>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerScroll: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  drawerContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  brandBlock: {
    paddingHorizontal: 6,
    paddingBottom: 18,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ece7dc',
  },
  logo: {
    width: 124,
    height: 54,
    marginLeft: -2,
  },
  workspaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 6,
  },
  workspaceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#111',
  },
  workspaceLabel: {
    color: '#62645c',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  nav: {
    gap: 4,
  },
  navItem: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  navItemActive: {
    backgroundColor: '#f4f1ea',
  },
  navItemPressed: {
    backgroundColor: '#f7f5ef',
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f1ea',
  },
  navIconActive: {
    backgroundColor: '#111',
  },
  navLabel: {
    flex: 1,
    color: '#3f423c',
    fontSize: 15,
    fontWeight: '800',
  },
  navLabelActive: {
    color: '#111',
  },
  navActiveBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#111',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  switchButton: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    backgroundColor: '#fbfaf6',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  switchButtonPressed: {
    backgroundColor: '#f4f1ea',
    borderColor: '#d9d5ca',
  },
  switchIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
  },
  switchCopy: {
    flex: 1,
    minWidth: 0,
  },
  switchText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '900',
  },
  switchHint: {
    color: '#8a8d84',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  logoutButtonPressed: {
    backgroundColor: '#2a2a2a',
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  legalText: {
    textAlign: 'center',
    color: '#c4c1b6',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 16,
  },
});
