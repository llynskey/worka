import React from 'react';
import { FlatList, Text, View } from 'react-native';

const BidList = () => {
  const bids = []; // Replace this with actual bids data

  return (
    <FlatList
      data={bids}
      renderItem={({ item }) => (
        <View>
          <Text>{item.jobTitle}</Text>
          <Text>{item.amount}</Text>
        </View>
      )}
      keyExtractor={item => item.id}
    />
  );
};

export default BidList;
