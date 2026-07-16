import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const INK = '#111111';
const WHITE = '#ffffff';

/**
 * The Fixa logo, drawn with plain Views + Text (no SVG dependency, no raster) so
 * it renders identically on web and native and scales to any `height`. The mark
 * is a rounded square holding a bold "F" built from three bars; `markOnly` drops
 * the wordmark, and `light` reverses it for dark backgrounds. Geometry mirrors
 * assets/logo.svg (64px base grid).
 */
const Logo = ({ height = 40, markOnly = false, light = false, style = null, accessibilityLabel = 'Fixa' }) => {
  const s = height; // the mark is square: side === height
  const squareBg = light ? WHITE : INK;
  const barColor = light ? INK : WHITE;
  const textColor = light ? WHITE : INK;

  const bar = (left, top, width, h) => ({
    position: 'absolute',
    left: s * left,
    top: s * top,
    width: s * width,
    height: s * h,
    backgroundColor: barColor,
    borderRadius: Math.max(1, s * 0.02),
  });

  const mark = (
    <View style={{ width: s, height: s, borderRadius: s * 0.234, backgroundColor: squareBg }}>
      <View style={bar(0.328, 0.25, 0.125, 0.516)} />
      <View style={bar(0.328, 0.25, 0.359, 0.125)} />
      <View style={bar(0.328, 0.453, 0.266, 0.125)} />
    </View>
  );

  return (
    <View
      style={[markOnly ? null : styles.row, style]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {mark}
      {markOnly ? null : (
        <Text
          style={{
            marginLeft: s * 0.18,
            color: textColor,
            fontSize: s * 0.6,
            fontWeight: '800',
            letterSpacing: -s * 0.03,
            includeFontPadding: false,
          }}
        >
          Fixa
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});

export default Logo;
