import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';

/**
 * Reveals its children with a soft rise-and-fade the first time they
 * scroll into view. Re-measures whenever `tick` changes (the owning
 * ScrollView bumps it as the user scrolls). Native-driver only.
 */
const Reveal = ({ children, tick = 0, delay = 0, style = null }) => {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const { height: windowHeight } = useWindowDimensions();

  const check = useCallback(() => {
    if (revealed || !ref.current || typeof ref.current.measureInWindow !== 'function') return;
    ref.current.measureInWindow((x, y) => {
      if (Number.isFinite(y) && y < windowHeight * 0.92) {
        setRevealed(true);
      }
    });
  }, [revealed, windowHeight]);

  useEffect(() => {
    const id = setTimeout(check, 60);
    return () => clearTimeout(id);
  }, [check, tick]);

  useEffect(() => {
    if (!revealed) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 480,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 480,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [revealed, delay, opacity, translateY]);

  return (
    <View ref={ref} style={style} collapsable={false}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
    </View>
  );
};

export default Reveal;
