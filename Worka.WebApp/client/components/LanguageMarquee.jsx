import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const GAP = 12;
const SPEED_DESKTOP = 34; // pixels per second
const SPEED_PHONE = 26;

/**
 * The language selector as a slow horizontal marquee: a single row of language
 * buttons drifts steadily sideways and loops, so languages glide in from one
 * edge and out the other. The list is rendered twice back-to-back and the track
 * translates by exactly one copy's width, so the loop is seamless. Tapping a
 * button switches the UI language; the gentle drift echoes the headline
 * cross-fade. Web edges are softly masked so buttons fade in and out.
 */
const LanguageMarquee = ({ languages = [], activeCode, onSelect, isPhone = false, style }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [copyWidth, setCopyWidth] = useState(0);

  useEffect(() => {
    if (copyWidth <= 0) return undefined;
    const speed = isPhone ? SPEED_PHONE : SPEED_DESKTOP;
    translateX.setValue(0);
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -copyWidth,
        duration: (copyWidth / speed) * 1000,
        easing: Easing.linear,
        // JS driver: react-native-web does not reliably run looping transform
        // animations under the native driver, and translateX is composited
        // either way, so the drift stays smooth.
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [copyWidth, isPhone, translateX]);

  const renderCopy = (measure) => (
    <View
      style={styles.copy}
      onLayout={measure ? (e) => setCopyWidth(e.nativeEvent.layout.width) : undefined}
    >
      {languages.map((lang) => {
        const active = lang.code === activeCode;
        return (
          <Pressable
            key={`${measure ? 'a' : 'b'}-${lang.code}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Switch language to ${lang.label}`}
            onPress={() => onSelect(lang.code)}
            style={({ pressed }) => [
              styles.item,
              isPhone && styles.itemPhone,
              active && styles.itemActive,
              pressed && styles.itemPressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {lang.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.stage, isPhone && styles.stagePhone, edgeMask, style]}>
      <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
        {renderCopy(true)}
        {renderCopy(false)}
      </Animated.View>
    </View>
  );
};

// Soft fade at both edges so buttons emerge and vanish rather than being cut
// off. Web-only (mask-image); a no-op elsewhere.
const edgeMask =
  Platform.OS === 'web'
    ? ({
        maskImage:
          'linear-gradient(to right, transparent 0, #000 9%, #000 91%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0, #000 9%, #000 91%, transparent 100%)',
      })
    : null;

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stagePhone: {
    height: 56,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    // Let the row size to its content rather than the stage width.
    alignSelf: 'flex-start',
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    marginRight: GAP,
    borderWidth: 1,
    borderColor: '#e0dcce',
    borderRadius: 999,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  itemPhone: {
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  itemActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  itemPressed: {
    opacity: 0.85,
  },
  label: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelActive: {
    color: '#fff',
  },
});

export default LanguageMarquee;
