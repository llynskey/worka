import React from 'react';
import { View, Button, SafeAreaView } from 'react-native';
import { DrawerItemList } from '@react-navigation/drawer';

const SharedDrawerContent = (props) => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DrawerItemList {...props} />
      <View style={{ margin: 20 }}>
        <Button title="Logout" onPress={props.logoutHandler} />
      </View>
    </SafeAreaView>
  );
};

export default SharedDrawerContent;
