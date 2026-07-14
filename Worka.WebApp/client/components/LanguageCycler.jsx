import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

/**
 * Softly cross-fades a line of text through several languages.
 *
 * Layout stability: every variant is also rendered invisibly so the
 * container is always as tall as the tallest translation — the visible
 * text swaps inside a fixed frame and nothing below it shifts.
 *
 * Performance: only opacity/transform animate, with the native driver,
 * so the animation stays off the JS thread.
 */
const LanguageCycler = ({ items, textStyle, containerStyle, interval = 4200 }) => {
  const [index, setIndex] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const heightsRef = useRef({});
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  const safeItems = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);

  const onGhostLayout = useCallback(
    (ghostIndex) => (event) => {
      const { height } = event.nativeEvent.layout;
      heightsRef.current[ghostIndex] = height;
      const tallest = Math.max(...Object.values(heightsRef.current), 0);
      setMaxHeight((current) => (Math.abs(current - tallest) > 0.5 ? tallest : current));
    },
    []
  );

  useEffect(() => {
    setIndex(0);
    heightsRef.current = {};
  }, [safeItems.length]);

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    if (safeItems.length < 2) return undefined;

    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        // Browser tab is backgrounded; skip this cycle so we never leave
        // the headline stranded mid-fade.
        opacity.setValue(1);
        translateY.setValue(0);
        return;
      }

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -8,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIndex((current) => (current + 1) % safeItems.length);
        translateY.setValue(10);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, interval);

    return () => clearInterval(id);
  }, [interval, opacity, safeItems.length, translateY]);

  if (safeItems.length === 0) return null;

  return (
    <View style={[containerStyle, maxHeight > 0 ? { minHeight: maxHeight } : null]}>
      {/* Sizers: measured for the height lock, but clipped inside a
          zero-height box so they can never paint, whatever the platform
          does with opacity. */}
      <View style={styles.sizerClip} pointerEvents="none">
        {safeItems.map((item, ghostIndex) => (
          <Text
            key={`ghost-${ghostIndex}`}
            style={textStyle}
            onLayout={onGhostLayout(ghostIndex)}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            aria-hidden
          >
            {item}
          </Text>
        ))}
      </View>

      <Animated.Text style={[textStyle, styles.visible, { opacity, transform: [{ translateY }] }]}>
        {safeItems[index]}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  visible: {
    zIndex: 1,
  },
  sizerClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0,
    overflow: 'hidden',
    opacity: 0,
  },
});

export default LanguageCycler;
