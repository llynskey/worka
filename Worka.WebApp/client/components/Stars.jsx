import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Stars = ({ value, count, size = 15 }) => {
  if (value == null) {
    return <Text style={styles.noReviews}>No reviews yet</Text>;
  }

  const rounded = Math.round(Number(value));

  return (
    <View style={styles.row}>
      {[0, 1, 2, 3, 4].map((i) => (
        <MaterialCommunityIcons
          key={i}
          name={i < rounded ? 'star' : 'star-outline'}
          size={size}
          color={i < rounded ? '#111' : '#b9bbb2'}
        />
      ))}
      {count != null ? (
        <Text style={styles.countText}>
          {Number(value).toFixed(1)} ({count})
        </Text>
      ) : null}
    </View>
  );
};

export const StarInput = ({ value, onChange, size = 34 }) => (
  <View style={styles.row}>
    {[0, 1, 2, 3, 4].map((i) => (
      <TouchableOpacity
        key={i}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        onPress={() => onChange?.(i + 1)}
      >
        <MaterialCommunityIcons
          name={i < Math.round(Number(value) || 0) ? 'star' : 'star-outline'}
          size={size}
          color={i < Math.round(Number(value) || 0) ? '#111' : '#b9bbb2'}
        />
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  countText: {
    marginLeft: 6,
    color: '#62645c',
    fontWeight: '700',
    fontSize: 13,
  },
  noReviews: {
    color: '#62645c',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default Stars;
