const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeResult = ({ id, label, address, latitude, longitude, source }) => {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  if (lat === null || lng === null) return null;

  return {
    id: String(id ?? `${lat},${lng}`),
    label: label || address,
    address: address || label,
    latitude: lat,
    longitude: lng,
    source,
  };
};

const lookupWithMapbox = async (query) => {
  const url =
    'https://api.mapbox.com/search/geocode/v6/forward?' +
    new URLSearchParams({
      q: query,
      access_token: MAPBOX_TOKEN,
      limit: '5',
      types: 'address,street,place,postcode,locality,neighborhood',
    }).toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Location lookup failed.');
  }

  const payload = await response.json();
  return (payload.features ?? [])
    .map((feature) => {
      const coordinates = feature.geometry?.coordinates ?? [];
      const fullAddress = feature.properties?.full_address;
      const placeName = feature.properties?.name;
      const placeFormatted = feature.properties?.place_formatted;
      const label = fullAddress || [placeName, placeFormatted].filter(Boolean).join(', ');

      return normalizeResult({
        id: feature.id,
        label,
        address: fullAddress || label,
        latitude: coordinates[1],
        longitude: coordinates[0],
        source: 'mapbox',
      });
    })
    .filter(Boolean);
};

const lookupWithOpenStreetMap = async (query) => {
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      q: query,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '5',
    }).toString();

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Location lookup failed.');
  }

  const payload = await response.json();
  return (payload ?? [])
    .map((item) =>
      normalizeResult({
        id: item.place_id,
        label: item.display_name,
        address: item.display_name,
        latitude: item.lat,
        longitude: item.lon,
        source: 'openstreetmap',
      })
    )
    .filter(Boolean);
};

export async function lookupLocations(query) {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return [];
  }

  return MAPBOX_TOKEN ? lookupWithMapbox(trimmed) : lookupWithOpenStreetMap(trimmed);
}
