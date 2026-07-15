import React, { useContext, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, getErrorMessage } from '../api/workaApi';
import notify from '../Utils/notify';
import { AuthContext } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';

export default function SharedDrawerContent(props) {
  const { logoutHandler, userType } = props;
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

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScroll}>
      <View style={styles.drawerContainer}>
        <View style={styles.brandBlock}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.workspaceLabel}>
            {isCustomer ? t('drawer.customerWorkspace') : t('drawer.professionalWorkspace')}
          </Text>
        </View>

        <DrawerItemList
          {...props}
          labelStyle={styles.drawerLabel}
          itemStyle={styles.drawerItem}
          activeTintColor="#111"
          activeBackgroundColor="#f1ede4"
          inactiveTintColor="#4f524b"
        />

        <Pressable style={styles.switchButton} onPress={switchMode} disabled={switching}>
          {switching ? (
            <ActivityIndicator color="#111" />
          ) : (
            <>
              <MaterialCommunityIcons name="swap-horizontal" size={20} color="#111" />
              <View style={styles.switchCopy}>
                <Text style={styles.switchText}>
                  {isCustomer ? t('drawer.switchToProfessional') : t('drawer.switchToCustomer')}
                </Text>
                <Text style={styles.switchHint}>{t('drawer.switchHint')}</Text>
              </View>
            </>
          )}
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={logoutHandler}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>{t('drawer.logout')}</Text>
        </Pressable>

        <Text style={styles.legalText}>LSL</Text>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerScroll: {
    flexGrow: 1,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  drawerContainer: {
    flex: 1,
    paddingHorizontal: 18,
  },
  brandBlock: {
    paddingHorizontal: 6,
    paddingBottom: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ece7dc',
  },
  logo: {
    width: 128,
    height: 58,
  },
  workspaceLabel: {
    color: '#62645c',
    fontWeight: '800',
    marginTop: 4,
  },
  drawerItem: {
    borderRadius: 8,
    marginVertical: 4,
    overflow: 'hidden',
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  switchButton: {
    marginTop: 'auto',
    minHeight: 58,
    borderWidth: 1,
    borderColor: '#111',
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchCopy: {
    flexShrink: 1,
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
    marginTop: 1,
  },
  logoutButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    flexDirection: 'row',
    gap: 8,
  },
  legalText: {
    textAlign: 'center',
    color: '#b0b2a9',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 18,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});
