import React from 'react';
import { Text, View } from 'react-native';

const INK = '#111111';
const WHITE = '#ffffff';

/**
 * The Fixa wordmark, drawn as text (no SVG dependency, no raster) so it renders
 * identically on web and native and scales to any `height`. No separate icon —
 * an "F" mark beside the word "Fixa" just repeats the initial. `light` reverses
 * the colour for dark backgrounds. The standalone icon lives in favicon.svg.
 */
const Logo = ({ height = 40, light = false, style = null, accessibilityLabel = 'Fixa' }) => (
  <View style={style} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
    <Text
      style={{
        color: light ? WHITE : INK,
        fontSize: height * 0.82,
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
