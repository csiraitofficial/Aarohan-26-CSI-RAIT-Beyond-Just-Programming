import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Hospital } from '../services/hospitalService';
import {
  GeofenceEvent,
  requestLocationPermission,
  startGeofenceWatch,
  stopGeofenceWatch,
} from '../services/geofencingService';

interface UseGeofencingResult {
  isMonitoring: boolean;
  currentLat: number | null;
  currentLon: number | null;
  nearestHospital: Hospital | null;
  insideHospitalZone: boolean;
  lastEvent: GeofenceEvent | null;
  start: (hospitals: Hospital[]) => Promise<void>;
  stop: () => void;
}

export function useGeofencing(radiusKm: number = 0.5): UseGeofencingResult {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLon, setCurrentLon] = useState<number | null>(null);
  const [nearestHospital, setNearestHospital] = useState<Hospital | null>(null);
  const [insideHospitalZone, setInsideHospitalZone] = useState(false);
  const [lastEvent, setLastEvent] = useState<GeofenceEvent | null>(null);
  const hospitalsRef = useRef<Hospital[]>([]);

  const handleEvent = useCallback((event: GeofenceEvent) => {
    setLastEvent(event);
    if (event.type === 'enter') {
      setInsideHospitalZone(true);
      Alert.alert(
        '📍 Arrived at Hospital',
        `You are near ${event.hospital.name}`,
      );
    } else {
      setInsideHospitalZone(false);
    }
  }, []);

  const handleLocationUpdate = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      setCurrentLat(coords.latitude);
      setCurrentLon(coords.longitude);

      // update nearest
      if (hospitalsRef.current.length > 0) {
        setNearestHospital(hospitalsRef.current[0]);
      }
    },
    [],
  );

  const start = useCallback(
    async (hospitals: Hospital[]) => {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Location access is required for geofencing.');
        return;
      }
      hospitalsRef.current = hospitals;
      startGeofenceWatch(hospitals, handleEvent, handleLocationUpdate, radiusKm);
      setIsMonitoring(true);
    },
    [handleEvent, handleLocationUpdate, radiusKm],
  );

  const stop = useCallback(() => {
    stopGeofenceWatch();
    setIsMonitoring(false);
  }, []);

  useEffect(() => {
    return () => stopGeofenceWatch();
  }, []);

  return {
    isMonitoring,
    currentLat,
    currentLon,
    nearestHospital,
    insideHospitalZone,
    lastEvent,
    start,
    stop,
  };
}
