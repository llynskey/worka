import React from 'react';
import { Image, Text, View } from 'react-native';

const INK = '#111111';
const WHITE = '#ffffff';

/**
 * The Fixa logo: the hammer-in-circle mark (assets/mark.png — the original
 * hammer artwork on a transparent field) beside the "Fixa" wordmark. `height`
 * sizes the square mark; the wordmark scales with it. `light` switches the
 * wordmark colour for dark backgrounds (the mark reads on either).
 */
const Logo = ({ height = 40, light = false, style = null, accessibilityLabel = 'Fixa' }) => (
  <View
    style={[{ flexDirection: 'row', alignItems: 'center' }, style]}
    accessibilityRole="image"
    accessibilityLabel={accessibilityLabel}
  >
    <Image
      source={require('../assets/mark.png')}
      style={{ width: height, height, marginRight: height * 0.24 }}
      resizeMode="contain"
    />
    <Text
      style={{
        color: light ? WHITE : INK,
        fontSize: height * 0.62,
        fontWeight: '800',
        letterSpacing: -height * 0.03,
        includeFontPadding: false,
      }}
    >
      Fixa
    </Text>
  </View>
);

export default Logo;
