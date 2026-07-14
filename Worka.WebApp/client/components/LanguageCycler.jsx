import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

/**
 * Softly cross-fades a line of text through several languages.
 * Uses only opacity/transform with the native driver, so it stays
 * off the JS thread and cheap on all platforms.
 */
const LanguageCycler = ({ items, textStyle, containerStyle, interval = 4200 }) => {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  const safeItems = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);

  useEffect(() => {
    setIndex(0);
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
    <View style={containerStyle}>
      <Animated.Text style={[textStyle, { opacity, transform: [{ translateY }] }]}>
        {safeItems[index]}
      </Animated.Text>
    </View>
  );
};

export default LanguageCycler;
