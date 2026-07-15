import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const GAP = 12;
const SPEED_DESKTOP = 34; // pixels per second
const SPEED_PHONE = 26;
const IS_WEB = Platform.OS === 'web';

/**
 * The language selector as a slow horizontal marquee: a single row of language
 * buttons drifts steadily sideways and loops, so languages glide in from one
 * edge and out the other. The list is rendered twice back-to-back; the track
 * translates by exactly one copy's width, so the loop is seamless.
 *
 * On web the drift is a CSS keyframe animation (translateX to -50% of the
 * doubled track), which needs no measurement and stays on the compositor. On
 * native it falls back to an Animated loop once a copy's width is known. Tapping
 * a button switches the UI language; the gentle drift echoes the headline
 * cross-fade, and the edges are softly masked so buttons fade in and out.
 */
const LanguageMarquee = ({ languages = [], activeCode, onSelect, isPhone = false, style }) => {
  const trackRef = useRef(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const [copyWidth, setCopyWidth] = useState(0);

  // Web: run a seamless CSS marquee on the underlying DOM node.
  useEffect(() => {
    if (!IS_WEB) return undefined;
    const el = trackRef.current;
    if (!el) return undefined;

    const styleId = 'worka-marquee-keyframes';
    if (!document.getElementById(styleId)) {
      const tag = document.createElement('style');
      tag.id = styleId;
      tag.textContent =
        '@keyframes worka-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}';
      document.head.appendChild(tag);
    }

    const oneCopy = el.scrollWidth / 2;
    const speed = isPhone ? SPEED_PHONE : SPEED_DESKTOP;
    const duration = Math.max(oneCopy / speed, 8);
    el.style.animation = `worka-marquee ${duration}s linear infinite`;
    el.style.willChange = 'transform';
    return () => {
      if (el) el.style.animation = '';
    };
  }, [isPhone, languages]);

  // Native: drive the same drift with Animated once a copy has been measured.
  useEffect(() => {
    if (IS_WEB || copyWidth <= 0) return undefined;
    const speed = isPhone ? SPEED_PHONE : SPEED_DESKTOP;
    translateX.setValue(0);
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -copyWidth,
        duration: (copyWidth / speed) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [copyWidth, isPhone, translateX]);

  const renderCopy = (measure) => (
    <View
      key={measure ? 'a' : 'b'}
      style={styles.copy}
      onLayout={!IS_WEB && measure ? (e) => setCopyWidth(e.nativeEvent.layout.width) : undefined}
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

  const Track = IS_WEB ? View : Animated.View;
  const trackStyle = IS_WEB ? styles.track : [styles.track, { transform: [{ translateX }] }];

  return (
    <View style={[styles.stage, isPhone && styles.stagePhone, edgeMask, style]}>
      <Track ref={trackRef} style={trackStyle}>
        {renderCopy(true)}
        {renderCopy(false)}
      </Track>
    </View>
  );
};

// Soft fade at both edges so buttons emerge and vanish rather than being cut
// off. Web-only (mask-image); a no-op elsewhere.
const edgeMask = IS_WEB
  ? {
      maskImage:
        'linear-gradient(to right, transparent 0, #000 9%, #000 91%, transparent 100%)',
      WebkitMaskImage:
        'linear-gradient(to right, transparent 0, #000 9%, #000 91%, transparent 100%)',
    }
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
    ...(IS_WEB ? { cursor: 'pointer' } : null),
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
