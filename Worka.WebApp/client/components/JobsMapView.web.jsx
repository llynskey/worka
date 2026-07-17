import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Real interactive map (web) that plots every located job as a clickable pin and
// draws the distance-radius circle around the worker's location, so the slider,
// map and list all stay in sync. Mapbox GL is loaded from its CDN on demand so
// it isn't bundled. Needs EXPO_PUBLIC_MAPBOX_TOKEN at build time.
const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const VERSION = 'v3.6.0';

let loadPromise = null;
function loadMapbox() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('mapbox-gl-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-gl-css';
      link.rel = 'stylesheet';
      link.href = `https://api.mapbox.com/mapbox-gl-js/${VERSION}/mapbox-gl.css`;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = `https://api.mapbox.com/mapbox-gl-js/${VERSION}/mapbox-gl.js`;
    script.onload = () => resolve(window.mapboxgl);
    script.onerror = () => reject(new Error('mapbox failed to load'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

// Polygon approximating a circle of radiusKm around a lng/lat, for the radius overlay.
function circleFeature(lng, lat, radiusKm, points = 72) {
  const coords = [];
  const dx = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const dy = radiusKm / 110.574;
  for (let i = 0; i < points; i += 1) {
    const t = (i / points) * 2 * Math.PI;
    coords.push([lng + dx * Math.cos(t), lat + dy * Math.sin(t)]);
  }
  coords.push(coords[0]);
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } };
}

const JobsMapView = ({
  jobs = [],
  selectedJobId = null,
  onSelectJob,
  userLocation = null,
  origin = null,
  radiusKm = null,
  inRadiusIds = null,
  style,
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const readyRef = useRef(false);
  const fittedRef = useRef(false);
  const dataRef = useRef({});
  dataRef.current = { jobs, selectedJobId, onSelectJob, userLocation, origin, radiusKm, inRadiusIds };

  const updateRadius = () => {
    const map = mapRef.current;
    const src = map && map.getSource && map.getSource('radius');
    if (!src) return;
    const { origin: o, radiusKm: km } = dataRef.current;
    if (o && Number.isFinite(Number(o.latitude)) && Number.isFinite(Number(o.longitude)) && km > 0) {
      src.setData({ type: 'FeatureCollection', features: [circleFeature(Number(o.longitude), Number(o.latitude), km)] });
    } else {
      src.setData({ type: 'FeatureCollection', features: [] });
    }
  };

  const draw = (mapboxgl) => {
    const map = mapRef.current;
    if (!map) return;
    const { jobs: js, selectedJobId: sel, onSelectJob: onSel, userLocation: loc, inRadiusIds: ids } = dataRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const bounds = new mapboxgl.LngLatBounds();
    let has = false;

    js.forEach((job) => {
      const lat = Number(job.latitude);
      const lng = Number(job.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const on = job.jobId === sel;
      const inR = !ids || ids.has(job.jobId);
      const el = document.createElement('div');
      const size = on ? 24 : inR ? 16 : 12;
      const bg = on ? '#24513b' : inR ? '#111' : '#b7b3a6';
      el.style.cssText =
        `width:${size}px;height:${size}px;border-radius:50%;background:${bg};` +
        `border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer;opacity:${inR || on ? 1 : 0.75};`;
      el.title = job.jobName || '';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSel?.(job.jobId);
      });
      markersRef.current.push(new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map));
      bounds.extend([lng, lat]);
      has = true;
    });

    if (loc && Number.isFinite(Number(loc.latitude)) && Number.isFinite(Number(loc.longitude))) {
      const el = document.createElement('div');
      el.style.cssText =
        'width:14px;height:14px;border-radius:50%;background:#2f6df6;border:2px solid #fff;box-shadow:0 0 0 4px rgba(47,109,246,.25);';
      markersRef.current.push(
        new mapboxgl.Marker({ element: el }).setLngLat([Number(loc.longitude), Number(loc.latitude)]).addTo(map)
      );
      bounds.extend([Number(loc.longitude), Number(loc.latitude)]);
      has = true;
    }

    updateRadius();

    if (has && !fittedRef.current && !bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 });
      fittedRef.current = true;
    }
  };

  useEffect(() => {
    if (!TOKEN || !containerRef.current) return undefined;
    let cancelled = false;
    loadMapbox()
      .then((mapboxgl) => {
        if (cancelled || mapRef.current || !containerRef.current) return;
        mapboxgl.accessToken = TOKEN;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-1.5, 52.5],
          zoom: 4,
          attributionControl: false,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        mapRef.current = map;
        map.on('load', () => {
          if (cancelled) return;
          map.addSource('radius', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.addLayer({ id: 'radius-fill', type: 'fill', source: 'radius', paint: { 'fill-color': '#111', 'fill-opacity': 0.06 } });
          map.addLayer({
            id: 'radius-line',
            type: 'line',
            source: 'radius',
            paint: { 'line-color': '#111', 'line-opacity': 0.35, 'line-width': 1.5, 'line-dasharray': [2, 2] },
          });
          readyRef.current = true;
          map.resize();
          draw(mapboxgl);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      readyRef.current = false;
      fittedRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (readyRef.current && window.mapboxgl) draw(window.mapboxgl);
  }, [jobs, selectedJobId, userLocation, origin, radiusKm, inRadiusIds]);

  if (!TOKEN) {
    return (
      <View style={[styles.fallback, style]}>
        <MaterialCommunityIcons name="map-outline" size={30} color="#111" />
        <Text style={styles.fallbackText}>Map unavailable — set EXPO_PUBLIC_MAPBOX_TOKEN and rebuild.</Text>
      </View>
    );
  }

  return React.createElement('div', {
    ref: containerRef,
    style: { width: '100%', height: '100%', minHeight: 0, borderRadius: 8, overflow: 'hidden' },
  });
};

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fbfaf6',
  },
  fallbackText: { color: '#62645c', textAlign: 'center', marginTop: 8, fontWeight: '700', lineHeight: 20 },
});

export default JobsMapView;
