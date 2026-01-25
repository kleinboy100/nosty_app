import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, MapPin, Store, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface DeliveryRouteMapProps {
  status: string;
  restaurantAddress?: string;
  customerAddress?: string;
  restaurantCoords?: { lat: number; lng: number };
  customerCoords?: { lat: number; lng: number };
  restaurantName?: string;
  className?: string;
}

interface RouteData {
  route: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}

// Component to fit bounds when route is loaded
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  
  return null;
}

export function DeliveryRouteMap({
  status,
  restaurantAddress,
  customerAddress,
  restaurantCoords,
  customerCoords,
  restaurantName,
  className
}: DeliveryRouteMapProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [resolvedRestaurantCoords, setResolvedRestaurantCoords] = useState<{ lat: number; lng: number } | null>(restaurantCoords || null);
  const [resolvedCustomerCoords, setResolvedCustomerCoords] = useState<{ lat: number; lng: number } | null>(customerCoords || null);
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  // Geocode addresses and fetch route
  useEffect(() => {
    const fetchRouteData = async () => {
      if (!restaurantAddress && !customerAddress && !restaurantCoords && !customerCoords) {
        setError('No location data available');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase.functions.invoke('calculate-distance', {
          body: {
            restaurantAddress,
            customerAddress,
            restaurantCoords,
            customerCoords,
            includeRoute: true
          }
        });

        if (fetchError) throw fetchError;

        if (data) {
          if (data.restaurantCoords) {
            setResolvedRestaurantCoords(data.restaurantCoords);
          }
          if (data.customerCoords) {
            setResolvedCustomerCoords(data.customerCoords);
          }
          if (data.route) {
            setRouteData({
              route: data.route,
              distanceKm: data.distanceKm || 0,
              durationMinutes: data.durationMinutes || 0
            });
          }
        }
      } catch (err) {
        console.error('Error fetching route:', err);
        setError('Could not load route');
      } finally {
        setLoading(false);
      }
    };

    fetchRouteData();
  }, [restaurantAddress, customerAddress, restaurantCoords, customerCoords]);

  // Animate driver along route when out_for_delivery
  useEffect(() => {
    if (status !== 'out_for_delivery' || !routeData?.route || routeData.route.length < 2) {
      setDriverPosition(null);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const route = routeData.route;
    let progress = 0;
    const totalDuration = 60000; // 60 seconds for full animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min((elapsed / totalDuration) % 1, 0.99);
      
      // Calculate position along route
      const totalPoints = route.length - 1;
      const pointProgress = progress * totalPoints;
      const currentIndex = Math.floor(pointProgress);
      const localProgress = pointProgress - currentIndex;
      
      if (currentIndex < route.length - 1) {
        const start = route[currentIndex];
        const end = route[currentIndex + 1];
        
        const lat = start[0] + (end[0] - start[0]) * localProgress;
        const lng = start[1] + (end[1] - start[1]) * localProgress;
        
        setDriverPosition({ lat, lng });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, routeData]);

  // Calculate bounds for map
  const getBounds = (): L.LatLngBoundsExpression | null => {
    const points: [number, number][] = [];
    
    if (resolvedRestaurantCoords) {
      points.push([resolvedRestaurantCoords.lat, resolvedRestaurantCoords.lng]);
    }
    if (resolvedCustomerCoords) {
      points.push([resolvedCustomerCoords.lat, resolvedCustomerCoords.lng]);
    }
    
    if (points.length < 2) return null;
    
    return points as L.LatLngBoundsExpression;
  };

  if (loading) {
    return (
      <div className={cn("bg-muted rounded-xl p-8 flex items-center justify-center", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading route map...</span>
        </div>
      </div>
    );
  }

  if (error || !resolvedRestaurantCoords || !resolvedCustomerCoords) {
    return (
      <div className={cn("bg-muted rounded-xl p-6 text-center", className)}>
        <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{error || 'Could not load map'}</p>
      </div>
    );
  }

  const center: [number, number] = [
    (resolvedRestaurantCoords.lat + resolvedCustomerCoords.lat) / 2,
    (resolvedRestaurantCoords.lng + resolvedCustomerCoords.lng) / 2
  ];

  return (
    <div className={cn("rounded-xl overflow-hidden", className)}>
      {/* Map Info Bar */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm text-muted-foreground">Restaurant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">You</span>
          </div>
          {status === 'out_for_delivery' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">Driver</span>
            </div>
          )}
        </div>
        {routeData && (
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {routeData.distanceKm.toFixed(1)} km • ~{Math.round(routeData.durationMinutes)} min
            </p>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="h-64 relative">
        <MapContainer
          center={center}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <FitBounds bounds={getBounds()} />

          {/* Route line */}
          {routeData?.route && (
            <Polyline
              positions={routeData.route}
              color="hsl(var(--primary))"
              weight={4}
              opacity={0.8}
            />
          )}

          {/* Restaurant marker */}
          <Marker 
            position={[resolvedRestaurantCoords.lat, resolvedRestaurantCoords.lng]} 
            icon={restaurantIcon}
          >
            <Popup>
              <div className="text-center">
                <Store className="w-4 h-4 mx-auto mb-1" />
                <strong>{restaurantName || 'Restaurant'}</strong>
              </div>
            </Popup>
          </Marker>

          {/* Customer marker */}
          <Marker 
            position={[resolvedCustomerCoords.lat, resolvedCustomerCoords.lng]} 
            icon={customerIcon}
          >
            <Popup>
              <div className="text-center">
                <User className="w-4 h-4 mx-auto mb-1" />
                <strong>Delivery Location</strong>
              </div>
            </Popup>
          </Marker>

          {/* Driver marker (animated) */}
          {status === 'out_for_delivery' && driverPosition && (
            <Marker 
              position={[driverPosition.lat, driverPosition.lng]} 
              icon={driverIcon}
            >
              <Popup>
                <div className="text-center">
                  <strong>🛵 Driver</strong>
                  <p className="text-xs">On the way!</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Status indicator */}
      {status === 'out_for_delivery' && (
        <div className="bg-primary/10 p-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-foreground">Driver is heading to your location</span>
        </div>
      )}
    </div>
  );
}
