/**
 * Foreground geofencing service using expo-location.
 * Works in Expo Go — polls location and checks proximity to hospitals.
 */

import * as Location from 'expo-location';
import { Hospital, isInsideHospitalZone } from './hospitalService';

export interface GeofenceEvent {
  hospital: Hospital;
  type: 'enter' | 'exit';
  timestamp: number;
}

export type GeofenceCallback = (event: GeofenceEvent) => void;

let watchSubscription: Location.LocationSubscription | null = null;
let insideZones = new Set<number>(); // hospital ids currently inside

/**
 * Request foreground location permission.
 * Returns true if granted.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Get current device position with a timeout.
 */
export async function getCurrentPosition(): Promise<Location.LocationObject> {
  // Try last known location first (instant)
  const last = await Location.getLastKnownPositionAsync();
  if (last && Date.now() - last.timestamp < 60000) {
    return last;
  }
  // Fall back to fresh GPS with low accuracy for speed
  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Low,
  });
}

/**
 * Start foreground geofence monitoring.
 * Polls location every `intervalMs` and checks proximity to each hospital.
 * Calls `onEvent` when a patient enters/exits a hospital zone.
 */
export function startGeofenceWatch(
  hospitals: Hospital[],
  onEvent: GeofenceCallback,
  onLocationUpdate?: (coords: { latitude: number; longitude: number }) => void,
  radiusKm: number = 0.5,
  intervalMs: number = 10000,
): void {
  stopGeofenceWatch();
  insideZones.clear();

  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: intervalMs,
      distanceInterval: 50, // meters
    },
    (location) => {
      const { latitude, longitude } = location.coords;
      onLocationUpdate?.({ latitude, longitude });

      for (const hospital of hospitals) {
        const inside = isInsideHospitalZone(latitude, longitude, hospital, radiusKm);
        const wasInside = insideZones.has(hospital.id);

        if (inside && !wasInside) {
          insideZones.add(hospital.id);
          onEvent({ hospital, type: 'enter', timestamp: Date.now() });
        } else if (!inside && wasInside) {
          insideZones.delete(hospital.id);
          onEvent({ hospital, type: 'exit', timestamp: Date.now() });
        }
      }
    },
  ).then((sub) => {
    watchSubscription = sub;
  });
}

/**
 * Stop geofence monitoring.
 */
export function stopGeofenceWatch(): void {
  if (watchSubscription) {
    watchSubscription.remove();
    watchSubscription = null;
  }
  insideZones.clear();
}
