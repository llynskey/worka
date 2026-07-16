import React from 'react';
import { Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistance, getDistanceKm, hasCoordinates } from '../Utils/locationUtils';
import { useI18n } from '../i18n/I18nContext';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

const getStaticMapUrl = ({ latitude, longitude, userLocation }) => {
  const overlays = [`pin-l+111111(${longitude},${latitude})`];
  let viewport = `${longitude},${latitude},13,0`;
  let extraParams = '';

  if (userLocation) {
    overlays.push(`pin-s+24513b(${Number(userLocation.longitude)},${Number(userLocation.latitude)})`);
    viewport = 'auto';
    extraParams = '&padding=60';
  }

  return (
    `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/` +
    `${overlays.join(',')}/${viewport}/700x400@2x` +
    `?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false${extraParams}`
  );
};

const getOsmEmbedUrl = ({ latitude, longitude }) => {
  const latPadding = 0.02;
  const lngPadding = 0.03;
  const bbox = [
    longitude - lngPadding,
    latitude - latPadding,
    longitude + lngPadding,
    latitude + latPadding,
  ].join(',');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
};

const openExternalMap = (latitude, longitude) => {
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
};

const PlaceholderCard = ({ height, label, fill = false }) => (
  <View style={[styles.placeholder, fill ? styles.fillMap : { height }]}>
    <MaterialCommunityIcons name="map-marker-outline" size={30} color="#111" />
    <Text style={styles.placeholderText}>{label}</Text>
  </View>
);

// `fill` makes the map grow to its container (used by the desktop Job Map so the
// map box fills the pane exactly — no empty space, no viewport overflow);
// otherwise it renders at the fixed `height`.
const MapPreview = ({ latitude, longitude, userLocation = null, height = 240, locationLabel = '', fill = false }) => {
  const { t } = useI18n();

  if (!hasCoordinates({ latitude, longitude })) {
    return <PlaceholderCard height={height} fill={fill} label={t('map.notSet')} />;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  const validUserLocation = userLocation && hasCoordinates(userLocation) ? userLocation : null;

  let mapNode;
  if (MAPBOX_TOKEN) {
    mapNode = (
      <Image
        source={{ uri: getStaticMapUrl({ latitude: lat, longitude: lng, userLocation: validUserLocation }) }}
        style={[styles.staticImage, fill ? styles.fillMap : { height }]}
        resizeMode="cover"
      />
    );
  } else if (Platform.OS === 'web') {
    mapNode = React.createElement('iframe', {
      src: getOsmEmbedUrl({ latitude: lat, longitude: lng }),
      title: locationLabel ? `Map of ${locationLabel}` : 'Job location map',
      style: fill
        ? { border: 0, width: '100%', flex: 1, minHeight: 0, display: 'block', borderRadius: 8 }
        : { border: 0, width: '100%', height, display: 'block', borderRadius: 8 },
    });
  } else {
    mapNode = <PlaceholderCard height={height} fill={fill} label={locationLabel || t('map.previewUnavailable')} />;
  }

  const distanceLabel = validUserLocation
    ? formatDistance(getDistanceKm(validUserLocation, { latitude: lat, longitude: lng }))
    : '';

  return (
    <View style={fill ? styles.wrapFill : styles.wrap}>
      {mapNode}
      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={17} color="#62645c" />
        <Text style={styles.metaText} numberOfLines={2}>
          {locationLabel || t('map.pinned')}
        </Text>
        {distanceLabel ? (
          <View style={styles.distanceChip}>
            <Text style={styles.distanceChipText}>{distanceLabel}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.openButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => openExternalMap(lat, lng)}
        >
          <MaterialCommunityIcons name="open-in-new" size={15} color="#111" />
          <Text style={styles.openButtonText}>{t('map.openInMaps')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  wrapFill: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  fillMap: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  staticImage: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#f1ede4',
  },
  placeholder: {
    width: '100%',
    backgroundColor: '#fbfaf6',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholderText: {
    color: '#62645c',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  metaText: {
    flex: 1,
    minWidth: 120,
    color: '#62645c',
    fontWeight: '600',
    lineHeight: 19,
  },
  distanceChip: {
    minHeight: 28,
    backgroundColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceChipText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  openButton: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  openButtonText: {
    color: '#111',
    fontWeight: '900',
    fontSize: 12,
  },
});

export default MapPreview;
