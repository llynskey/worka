import React, { useEffect, useRef } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const GAP = 12;
const SPEED_DESKTOP = 34; // idle drift, pixels per second
const SPEED_PHONE = 26;
const FRICTION = 1.8; // how quickly a fling eases back toward the idle drift
const MAX_FLING = 4200; // px/s cap so a hard throw stays sane
const IS_WEB = Platform.OS === 'web';

/**
 * The language selector as a draggable marquee. Left to itself it drifts slowly
 * and loops; you can grab and throw it, and it keeps moving with momentum before
 * easing back to the idle drift. A single physics loop owns the offset:
 *
 *   - idle / coasting: velocity eases toward the base drift (FRICTION), and the
 *     offset integrates it each frame;
 *   - dragging: the offset follows the pointer directly;
 *   - release: the fling velocity seeds the coast, which decays back to drift.
 *
 * The list is rendered twice and the offset wraps by one copy's width, so the
 * loop is seamless in either direction. Tapping a button still selects a
 * language — the pan only engages once you actually drag sideways.
 */
const LanguageMarquee = ({ languages = [], activeCode, onSelect, isPhone = false, style }) => {
  const trackRef = useRef(null);
  const offset = useRef(0); // current translateX in px (<= 0 after wrap)
  const velocity = useRef(0); // px/s
  const copyW = useRef(0); // width of one copy, incl. trailing gap
  const dragging = useRef(false);
  const dragStart = useRef(0);

  const baseVel = -(isPhone ? SPEED_PHONE : SPEED_DESKTOP); // leftward drift

  const applyOffset = () => {
    const el = trackRef.current;
    if (!el) return;
    if (IS_WEB) {
      el.style.transform = `translateX(${offset.current}px)`;
    } else if (el.setNativeProps) {
      el.setNativeProps({ style: { transform: [{ translateX: offset.current }] } });
    }
  };

  // Keep the offset within (-copyW, 0] so the doubled track loops seamlessly.
  const wrap = () => {
    const w = copyW.current;
    if (w <= 0) return;
    while (offset.current <= -w) offset.current += w;
    while (offset.current > 0) offset.current -= w;
  };

  useEffect(() => {
    velocity.current = baseVel;
    // On web onLayout is unreliable here, so measure the doubled track's DOM
    // width directly; one copy is half of it.
    if (IS_WEB && trackRef.current) {
      copyW.current = trackRef.current.scrollWidth / 2;
    }
    let raf;
    let last = 0;
    const tick = (t) => {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      if (!dragging.current && dt > 0) {
        // Ease the current velocity back toward the idle drift, then advance.
        velocity.current += (baseVel - velocity.current) * Math.min(1, FRICTION * dt);
        offset.current += velocity.current * dt;
        wrap();
        applyOffset();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [baseVel, languages]);

  const pan = useRef(
    PanResponder.create({
      // Let plain taps through to the buttons; only hijack on a real sideways drag.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        dragging.current = true;
        dragStart.current = offset.current;
        velocity.current = 0;
      },
      onPanResponderMove: (_e, g) => {
        offset.current = dragStart.current + g.dx;
        wrap();
        applyOffset();
      },
      onPanResponderRelease: (_e, g) => {
        dragging.current = false;
        // gestureState.vx is px/ms; convert to px/s and cap it.
        velocity.current = Math.max(-MAX_FLING, Math.min(MAX_FLING, g.vx * 1000));
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
      },
    })
  ).current;

  const renderCopy = (which) => (
    <View
      key={which}
      style={styles.copy}
      onLayout={which === 'a' ? (e) => { copyW.current = e.nativeEvent.layout.width; } : undefined}
    >
      {languages.map((lang) => {
        const active = lang.code === activeCode;
        return (
          <Pressable
            key={`${which}-${lang.code}`}
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
    <View
      style={[styles.stage, isPhone && styles.stagePhone, edgeMask, style]}
      {...pan.panHandlers}
    >
      <View ref={trackRef} style={styles.track}>
        {renderCopy('a')}
        {renderCopy('b')}
      </View>
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
    ...(IS_WEB ? { cursor: 'grab', touchAction: 'pan-y' } : null),
  },
  stagePhone: {
    height: 56,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    ...(IS_WEB ? { willChange: 'transform' } : null),
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
