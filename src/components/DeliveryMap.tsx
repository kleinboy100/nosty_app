import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface DeliveryMapProps {
  restaurantAddress?: string;
  deliveryAddress?: string;
  status?: string;
  className?: string;
}

export function DeliveryMap({ restaurantAddress, deliveryAddress, status, className }: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current) return;

      try {
        // Fetch the Mapbox token from edge function
        const { data, error: fetchError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (fetchError || !data?.token) {
          setError('Map unavailable');
          setLoading(false);
          return;
        }

        mapboxgl.accessToken = data.token;

        // Default to Johannesburg, South Africa
        const defaultCenter: [number, number] = [28.0473, -26.2041];

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: defaultCenter,
          zoom: 12,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          // Add restaurant marker
          new mapboxgl.Marker({ color: '#f97316' })
            .setLngLat(defaultCenter)
            .setPopup(new mapboxgl.Popup().setHTML('<strong>Restaurant</strong><p>' + (restaurantAddress || 'Pickup Location') + '</p>'))
            .addTo(map.current!);

          // Add delivery location marker (slightly offset for demo)
          const deliveryLocation: [number, number] = [defaultCenter[0] + 0.02, defaultCenter[1] - 0.015];
          new mapboxgl.Marker({ color: '#10b981' })
            .setLngLat(deliveryLocation)
            .setPopup(new mapboxgl.Popup().setHTML('<strong>Delivery</strong><p>' + (deliveryAddress || 'Delivery Location') + '</p>'))
            .addTo(map.current!);

          // If order is out for delivery, show driver marker
          if (status === 'out_for_delivery') {
            const driverLocation: [number, number] = [defaultCenter[0] + 0.01, defaultCenter[1] - 0.008];
            driverMarker.current = new mapboxgl.Marker({ color: '#3b82f6' })
              .setLngLat(driverLocation)
              .setPopup(new mapboxgl.Popup().setHTML('<strong>Driver</strong><p>On the way!</p>'))
              .addTo(map.current!);

            // Animate driver (demo)
            let progress = 0;
            const animateDriver = () => {
              if (!driverMarker.current || !map.current) return;
              progress += 0.002;
              if (progress > 1) progress = 0;
              
              const lng = defaultCenter[0] + 0.01 + (0.01 * progress);
              const lat = defaultCenter[1] - 0.008 - (0.007 * progress);
              driverMarker.current.setLngLat([lng, lat]);
              
              requestAnimationFrame(animateDriver);
            };
            animateDriver();
          }

          // Draw route line
          map.current!.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  defaultCenter,
                  [defaultCenter[0] + 0.01, defaultCenter[1] - 0.008],
                  deliveryLocation
                ]
              }
            }
          });

          map.current!.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-dasharray': [2, 1]
            }
          });

          // Fit bounds to show all markers
          map.current!.fitBounds([
            [defaultCenter[0] - 0.01, defaultCenter[1] - 0.02],
            [deliveryLocation[0] + 0.01, defaultCenter[1] + 0.01]
          ], { padding: 50 });

          setLoading(false);
        });

      } catch (err) {
        setError('Failed to load map');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, [restaurantAddress, deliveryAddress, status]);

  if (error) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
