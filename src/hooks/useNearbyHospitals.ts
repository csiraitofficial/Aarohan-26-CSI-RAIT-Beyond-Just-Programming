import { useCallback, useEffect, useRef, useState } from 'react';
import { Hospital, fetchNearbyHospitals } from '../services/hospitalService';
import { getCurrentPosition, requestLocationPermission } from '../services/geofencingService';

type LoadingPhase = 'idle' | 'permission' | 'gps' | 'fetching' | 'done';

interface UseNearbyHospitalsResult {
  hospitals: Hospital[];
  loading: boolean;
  phase: LoadingPhase;
  error: string | null;
  userLat: number | null;
  userLon: number | null;
  refresh: () => void;
}

export function useNearbyHospitals(radiusKm: number = 5): UseNearbyHospitalsResult {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<LoadingPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setPhase('permission');
      const granted = await requestLocationPermission();
      if (!granted) {
        setError('Location permission denied');
        setLoading(false);
        setPhase('done');
        return;
      }

      if (!mounted.current) return;
      setPhase('gps');
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      if (!mounted.current) return;
      setUserLat(latitude);
      setUserLon(longitude);

      setPhase('fetching');
      const results = await fetchNearbyHospitals(latitude, longitude, radiusKm);
      if (!mounted.current) return;
      setHospitals(results);
    } catch (e: any) {
      if (mounted.current) {
        const msg = e.name === 'AbortError'
          ? 'Request timed out. Try again.'
          : (e.message || 'Failed to fetch hospitals');
        setError(msg);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        setPhase('done');
      }
    }
  }, [radiusKm]);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    return () => { mounted.current = false; };
  }, [fetchData]);

  return { hospitals, loading, phase, error, userLat, userLon, refresh: fetchData };
}
