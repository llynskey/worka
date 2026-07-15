import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * App-wide distance unit preference ('mi' | 'km'), defaulting to miles.
 *
 * Kept as a tiny external store rather than a context so any component can read
 * it — `formatDistance` falls back to it when no unit is passed — and the
 * Settings toggle updates every mounted `useDistanceUnit` consumer at once.
 */
const STORAGE_KEY = 'worka.distanceUnit';
const KM_PER_MILE = 1.609344;

let currentUnit = 'mi';
let loaded = false;
const listeners = new Set();

const notifyAll = () => listeners.forEach((listener) => listener());

const ensureLoaded = () => {
  if (loaded) return;
  loaded = true;
  AsyncStorage.getItem(STORAGE_KEY)
    .then((saved) => {
      if (saved === 'mi' || saved === 'km') {
        currentUnit = saved;
        notifyAll();
      }
    })
    .catch(() => {});
};

export const getDistanceUnit = () => currentUnit;

export const setDistanceUnit = (unit) => {
  if (unit !== 'mi' && unit !== 'km') return;
  currentUnit = unit;
  AsyncStorage.setItem(STORAGE_KEY, unit).catch(() => {});
  notifyAll();
};

export const kmToMiles = (km) => km / KM_PER_MILE;
export const milesToKm = (miles) => miles * KM_PER_MILE;

/** Reactive hook: returns the current unit and re-renders when it changes. */
export const useDistanceUnit = () => {
  const [unit, setUnit] = useState(currentUnit);
  useEffect(() => {
    ensureLoaded();
    const listener = () => setUnit(currentUnit);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return unit;
};
