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
      {/* Invisible sizers: reserve the height of the tallest variant. */}
      {safeItems.map((item, ghostIndex) => (
        <Text
          key={`ghost-${ghostIndex}`}
          style={[textStyle, styles.ghost]}
          onLayout={onGhostLayout(ghostIndex)}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
        >
          {item}
        </Text>
      ))}

      <Animated.Text style={[textStyle, { opacity, transform: [{ translateY }] }]}>
        {safeItems[index]}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
});

export default LanguageCycler;
