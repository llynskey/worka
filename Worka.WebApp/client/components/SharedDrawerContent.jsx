import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SharedDrawerContent(props) {
  const { logoutHandler, userType } = props;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScroll}>
      <View style={styles.drawerContainer}>
        <View style={styles.brandBlock}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.workspaceLabel}>{userType} workspace</Text>
        </View>

        <DrawerItemList
          {...props}
          labelStyle={styles.drawerLabel}
          itemStyle={styles.drawerItem}
          activeTintColor="#111"
          activeBackgroundColor="#f1ede4"
          inactiveTintColor="#4f524b"
        />

        <Pressable style={styles.logoutButton} onPress={logoutHandler}>
          <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
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
  logoutButton: {
    marginTop: 'auto',
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
