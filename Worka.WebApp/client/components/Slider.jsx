import React, { useRef, useState } from 'react';
import { PanResponder, Platform, StyleSheet, View } from 'react-native';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

/**
 * Minimal, dependency-free horizontal slider (react-native has no core Slider).
 * Works with mouse (web) and touch (native) via PanResponder: tapping the track
 * jumps to that value, dragging adjusts from there. Live props are read through
 * a ref so the responder — created once — never uses stale callbacks.
 */
const Slider = ({ value, min = 0, max = 100, step = 1, onChange, style }) => {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const grantValue = useRef(value);
  const cfg = useRef({ min, max, step, onChange });
  cfg.current = { min, max, step, onChange };

  const snap = (raw) => {
    const { min: lo, max: hi, step: st } = cfg.current;
    return clamp(Math.round(raw / st) * st, lo, hi);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { min: lo, max: hi, onChange: cb } = cfg.current;
        const w = widthRef.current || 1;
        const ratio = clamp((evt.nativeEvent.locationX ?? 0) / w, 0, 1);
        const v = snap(lo + ratio * (hi - lo));
        grantValue.current = v;
        cb?.(v);
      },
      onPanResponderMove: (_evt, g) => {
        const { min: lo, max: hi, onChange: cb } = cfg.current;
        const w = widthRef.current || 1;
        const span = hi - lo || 1;
        const ratio = (grantValue.current - lo) / span + g.dx / w;
        cb?.(snap(lo + clamp(ratio, 0, 1) * span));
      },
    })
  ).current;

  const ratio = max > min ? clamp((value - min) / (max - min), 0, 1) : 0;
  const thumbLeft = clamp(ratio * width - 13, 0, Math.max(0, width - 26));

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      {...pan.panHandlers}
    >
      <View style={styles.track} />
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      <View style={[styles.thumb, { left: thumbLeft }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', touchAction: 'none' } : null),
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#e3dfd2',
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  thumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#111',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default Slider;
