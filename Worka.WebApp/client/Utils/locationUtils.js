import { getDistanceUnit, kmToMiles } from './distanceUnit';

export const hasCoordinates = (item) =>
  Number.isFinite(Number(item?.latitude)) && Number.isFinite(Number(item?.longitude));

export const getDistanceKm = (from, to) => {
  if (!from || !hasCoordinates(to)) return null;

  const lat1 = Number(from.latitude);
  const lon1 = Number(from.longitude);
  const lat2 = Number(to.latitude);
  const lon2 = Number(to.longitude);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const earthRadiusKm = 6371;
  const toRad = (value) => (value * Math.PI) / 180;
  const deltaLat = toRad(lat2 - lat1);
  const deltaLon = toRad(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Unit defaults to the user's saved preference (miles by default). Passing a
// unit explicitly keeps this pure for tests / one-off callers.
export const formatDistance = (distanceKm, unit) => {
  if (!Number.isFinite(distanceKm)) return '';
  const resolved = unit || getDistanceUnit();

  if (resolved === 'mi') {
    const miles = kmToMiles(distanceKm);
    if (miles < 0.1) return `${Math.round(miles * 1760)} yd away`;
    if (miles < 10) return `${miles.toFixed(1)} mi away`;
    return `${Math.round(miles)} mi away`;
  }

  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km away`;
  return `${Math.round(distanceKm)} km away`;
};

export const requestCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      // navigator.geolocation exists in browsers only; native builds don't
      // ship a location module yet, so fail with an honest message.
      reject(new Error('Location is not available on this device yet. Jobs are shown newest first instead.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => reject(new Error('Could not get your current location. Check browser permissions.')),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
