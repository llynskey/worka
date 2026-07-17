import { Platform, useWindowDimensions } from 'react-native';

/**
 * Shared design tokens for the workspace. One source of truth for colour,
 * spacing, radius, elevation and motion so the surfaces read as one system
 * instead of each file re-inventing near-identical greys (and the odd stray
 * lime-green left over from an earlier brand).
 */
export const isWeb = Platform.OS === 'web';

export const colors = {
  ink: '#111111', // primary text / primary action
  inkSoft: '#4d504b', // body text
  muted: '#62645c', // secondary text
  mutedSoft: '#8a8d84', // captions / timestamps
  paper: '#f7f5ef', // app background
  surface: '#ffffff', // cards
  surfaceAlt: '#fbfaf6', // insets, inputs, tiles
  border: '#e3dfd2', // default hairline
  borderSoft: '#ece7dc', // softer divider
  line: '#f1ede4', // faint inner rows
  hero: '#18201d', // dark feature surface
  onHero: '#e7ede8', // body text on the dark surface
  accent: '#24513b', // deep green = positive / brand accent (replaces the old lime)
  accentSoft: '#dff4e8', // green tint fill
  accentOnDark: '#9fd8b6', // accent text on the dark surface (was #d6f36a)
  danger: '#8c2f2f',
  white: '#ffffff',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

// Breakpoints — keep in sync with useLayout() below.
export const bp = { tablet: 700, desktop: 1000, wide: 1280 };

// Elevation. On web these compile to real box-shadows (with an inner highlight
// for a machined feel); on native they map to the RN shadow props.
export const shadow = {
  card: isWeb
    ? { boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 10px 26px rgba(0,0,0,0.06)' }
    : { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2 },
  raised: isWeb
    ? {
        boxShadow:
          '0 1px 1px rgba(0,0,0,0.04), 0 14px 30px rgba(0,0,0,0.08), 0 30px 60px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
      }
    : { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 5 },
};

// Tactile inset-highlight emboss for dark surfaces (primary buttons, active
// pills). Web-only; a no-op elsewhere. Matches the landing page.
export const embossDark = isWeb
  ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 10px 22px rgba(0,0,0,0.22)' }
  : null;

// Subtle letterpress for dark headings on the light page. Cross-platform.
export const embossTitle = {
  textShadowColor: 'rgba(255,255,255,0.7)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 0,
};

// One responsive hook the whole workspace shares.
export const useLayout = () => {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isPhone: width < bp.tablet,
    isTablet: width >= bp.tablet && width < bp.desktop,
    isDesktop: width >= bp.desktop,
    isWide: width >= bp.wide,
  };
};
