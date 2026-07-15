import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LANGUAGE_SHOWCASE } from '../i18n/languageShowcase';

/**
 * The language selector, as a slow "carousel": the selectable languages sit in
 * one or two concentric rings that rotate gently around a centre. Each bubble
 * is a real button — tapping it switches the UI language — and counter-rotates
 * so its label stays upright as the ring turns. The active language is filled.
 */

const FLAG_BY_CODE = LANGUAGE_SHOWCASE.reduce((map, item) => {
  map[item.code] = item.flag;
  return map;
}, {});

// One ring of bubbles. `spin` (0→1, looping) drives rotation; each bubble
// applies the inverse rotation so its text never turns upside down.
const Ring = ({ items, radius, spin, reverse, activeCode, onSelect, isPhone }) => {
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg'],
  });
  const counter = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ['-360deg', '0deg'] : ['0deg', '-360deg'],
  });

  return (
    <Animated.View style={[styles.ring, { transform: [{ rotate }] }]}>
      {items.map((item, index) => {
        const angle = (2 * Math.PI * index) / items.length;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const active = item.code === activeCode;
        return (
          <Animated.View
            key={item.code}
            style={[
              styles.bubbleWrap,
              { transform: [{ translateX: x }, { translateY: y }, { rotate: counter }] },
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
              <Text
                style={[styles.label, active && styles.labelActive]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
};

const LanguageBubbles = ({ languages = [], activeCode, onSelect, isPhone = false, style }) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 72000, // one slow revolution per ~72s
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

  const size = isPhone ? 320 : 400;
  const half = isPhone ? 54 : 64;
  const outerR = size / 2 - half - 4;
  const innerR = outerR * 0.52;

  // Split into two rings only when a single ring would crowd; the inner ring
  // takes the tail so the outer ring stays the fuller one.
  const innerCount = items.length > 5 ? Math.min(3, Math.floor(items.length / 2)) : 0;
  const outer = items.slice(0, items.length - innerCount);
  const inner = items.slice(items.length - innerCount);

  return (
    <View style={[styles.stage, { width: size, height: size }, style]}>
      <Ring
        items={outer}
        radius={outerR}
        spin={spin}
        reverse={false}
        activeCode={activeCode}
        onSelect={onSelect}
        isPhone={isPhone}
      />
      {inner.length > 0 ? (
        <Ring
          items={inner}
          radius={innerR}
          spin={spin}
          reverse
          activeCode={activeCode}
          onSelect={onSelect}
          isPhone={isPhone}
        />
      ) : null}

      <View style={styles.core}>
        <Text style={styles.coreText}>文A</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 118,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 999,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  bubblePhone: {
    maxWidth: 104,
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
  core: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  coreText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
});

export default LanguageBubbles;
