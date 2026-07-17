import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Real interactive map (web) that plots every located job as a clickable pin.
// Mapbox GL is loaded from its CDN on demand so it isn't bundled (and we avoid
// Metro CSS-import handling). Needs EXPO_PUBLIC_MAPBOX_TOKEN at build time.
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

const JobsMapView = ({ jobs = [], selectedJobId = null, onSelectJob, userLocation = null, style }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const readyRef = useRef(false);
  const fittedRef = useRef(false);
  // Keep the latest values available to the (stable) draw function.
  const dataRef = useRef({ jobs, selectedJobId, userLocation, onSelectJob });
  dataRef.current = { jobs, selectedJobId, userLocation, onSelectJob };

  const draw = (mapboxgl) => {
    const map = mapRef.current;
    if (!map) return;
    const { jobs: js, selectedJobId: sel, userLocation: loc, onSelectJob: onSel } = dataRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const bounds = new mapboxgl.LngLatBounds();
    let has = false;

    js.forEach((job) => {
      const lat = Number(job.latitude);
      const lng = Number(job.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const on = job.jobId === sel;
      const el = document.createElement('div');
      const size = on ? 24 : 16;
      el.style.cssText =
        `width:${size}px;height:${size}px;border-radius:50%;background:${on ? '#24513b' : '#111'};` +
        'border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);cursor:pointer;';
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

    if (has && !fittedRef.current && !bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 });
      fittedRef.current = true;
    }
  };

  // Initialise the map once.
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

  // Redraw markers when the data or selection changes.
  useEffect(() => {
    if (readyRef.current && window.mapboxgl) draw(window.mapboxgl);
  }, [jobs, selectedJobId, userLocation]);

  if (!TOKEN) {
    return (
      <View style={[styles.fallback, style]}>
        <MaterialCommunityIcons name="map-outline" size={30} color="#111" />
        <Text style={styles.fallbackText}>
          Map unavailable — set EXPO_PUBLIC_MAPBOX_TOKEN and rebuild.
        </Text>
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
  fallbackText: {
    color: '#62645c',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '700',
    lineHeight: 20,
  },
});

export default JobsMapView;
