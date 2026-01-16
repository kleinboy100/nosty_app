import { useState, useCallback } from 'react';

interface GeolocationState {
  loading: boolean;
  error: string | null;
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    address: null,
    coordinates: null
  });

  const getCurrentLocation = useCallback(async (): Promise<string | null> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setState(prev => ({ ...prev, coordinates: { lat: latitude, lng: longitude } }));

          try {
            // Reverse geocode using Mapbox
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${await getMapboxToken()}`
            );
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
              const address = data.features[0].place_name;
              setState({ loading: false, error: null, address, coordinates: { lat: latitude, lng: longitude } });
              resolve(address);
            } else {
              // Fallback to coordinates if no address found
              const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              setState({ loading: false, error: null, address: fallbackAddress, coordinates: { lat: latitude, lng: longitude } });
              resolve(fallbackAddress);
            }
          } catch {
            // Fallback to coordinates if geocoding fails
            const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setState({ loading: false, error: null, address: fallbackAddress, coordinates: { lat: latitude, lng: longitude } });
            resolve(fallbackAddress);
          }
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          setState({ loading: false, error: errorMessage, address: null, coordinates: null });
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  return { ...state, getCurrentLocation };
}

async function getMapboxToken(): Promise<string> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase.functions.invoke('get-mapbox-token');
    return data?.token || '';
  } catch {
    return '';
  }
}
