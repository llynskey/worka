import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LANGUAGE_SHOWCASE } from '../i18n/languageShowcase';

/**
 * The language selector as a slow-turning wheel. The selectable languages ride
 * a large circle whose centre sits at the bottom edge of a clipped viewport, so
 * only the top arc is on screen — as the wheel rotates, languages rise in from
 * one side, cross the top, and sink out the other, revealing the rest of the
 * set. Each button counter-rotates so its label stays upright, and tapping it
 * switches the UI language. The gentle cycling mirrors the headline animation.
 */

const FLAG_BY_CODE = LANGUAGE_SHOWCASE.reduce((map, item) => {
  map[item.code] = item.flag;
  return map;
}, {});

const LanguageWheel = ({ languages = [], activeCode, onSelect, isPhone = false, style }) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 46000, // one slow revolution; slow enough to read each label
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const items = useMemo(
    () => languages.map((l) => ({ code: l.code, label: l.label, flag: FLAG_BY_CODE[l.code] || '' })),
    [languages]
  );

  // Stage is a clipped band; the wheel's centre sits on its bottom edge so only
  // the upper half of the circle shows.
  const W = isPhone ? 320 : 460;
  const H = isPhone ? 176 : 208;
  const rItems = H - 28; // radius the buttons ride on
  const itemHalf = isPhone ? 56 : 64;
  const wheelSize = 2 * (rItems + itemHalf + 8);
  const center = wheelSize / 2;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const counter = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  return (
    <View style={[styles.stage, { width: W, height: H }, style]}>
      <Animated.View
        style={[
          styles.wheel,
          {
            width: wheelSize,
            height: wheelSize,
            left: W / 2 - center,
            top: H - center,
            transform: [{ rotate }],
          },
        ]}
      >
        {items.map((item, index) => {
          // Start the set spread across the top arc rather than the full circle,
          // so the first frame already looks like a wheel of languages.
          const angle = -Math.PI / 2 + (2 * Math.PI * index) / items.length;
          const x = center + rItems * Math.cos(angle);
          const y = center + rItems * Math.sin(angle);
          const active = item.code === activeCode;
          return (
            <Animated.View
              key={item.code}
              style={[
                styles.spoke,
                {
                  left: x - itemHalf,
                  top: y - 22,
                  width: itemHalf * 2,
                  transform: [{ rotate: counter }],
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Switch language to ${item.label}`}
                onPress={() => onSelect(item.code)}
                style={({ pressed }) => [
                  styles.bubble,
                  isPhone && styles.bubblePhone,
                  active && styles.bubbleActive,
                  pressed && styles.bubblePressed,
                ]}
              >
                {item.flag ? <Text style={styles.flag}>{item.flag}</Text> : null}
                <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'center',
    overflow: 'hidden',
  },
  wheel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spoke: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 122,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 999,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  bubblePhone: {
    maxWidth: 108,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  bubbleActive: {
    backgroundColor: '#111',
  },
  bubblePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  flag: {
    fontSize: 15,
  },
  label: {
    color: '#111',
    fontSize: 13,
    fontWeight: '800',
  },
  labelActive: {
    color: '#fff',
  },
});

export default LanguageWheel;
