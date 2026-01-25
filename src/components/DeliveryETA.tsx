import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Truck, ChefHat, Package, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryETAProps {
  status: string;
  orderCreatedAt: string;
  restaurantAddress?: string;
  customerAddress?: string;
  restaurantCoords?: { lat: number; lng: number };
  customerCoords?: { lat: number; lng: number };
  className?: string;
}

// Estimated durations for each status in minutes
const STATUS_DURATIONS: Record<string, number> = {
  pending: 5,        // 5 min for restaurant to confirm
  confirmed: 5,      // 5 min to start preparing
  preparing: 20,     // 20 min to prepare food
  ready: 5,          // 5 min for driver pickup
};

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

export function DeliveryETA({ 
  status, 
  orderCreatedAt, 
  restaurantAddress,
  customerAddress,
  restaurantCoords,
  customerCoords,
  className 
}: DeliveryETAProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [etaTime, setEtaTime] = useState<string>('');
  const [deliveryDuration, setDeliveryDuration] = useState<number>(15); // Default 15 min
  const [loadingDistance, setLoadingDistance] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<string>('');

  // Fetch actual delivery duration based on distance using OSRM (free)
  useEffect(() => {
    const calculateDeliveryTime = async () => {
      if (!restaurantAddress && !customerAddress && !restaurantCoords && !customerCoords) return;
      
      setLoadingDistance(true);
      try {
        const { data, error } = await supabase.functions.invoke('calculate-distance', {
          body: {
            restaurantAddress,
            customerAddress,
            restaurantCoords,
            customerCoords
          }
        });

        if (!error && data) {
          if (data.durationMinutes) {
            setDeliveryDuration(data.durationMinutes);
          }
          if (data.distanceKm) {
            setDistanceKm(data.distanceKm);
          }
          if (data.method) {
            setCalculationMethod(data.method);
          }
          console.log('Distance calculated:', data);
        }
      } catch (err) {
        console.error('Error calculating distance:', err);
      } finally {
        setLoadingDistance(false);
      }
    };

    calculateDeliveryTime();
  }, [restaurantAddress, customerAddress, restaurantCoords, customerCoords]);

  useEffect(() => {
    const calculateETA = () => {
      const orderTime = new Date(orderCreatedAt).getTime();
      const now = Date.now();
      const elapsedMinutes = (now - orderTime) / 60000;

      // Calculate total estimated time based on current status
      const currentStatusIndex = STATUS_ORDER.indexOf(status);
      let totalMinutes = 0;
      
      for (let i = currentStatusIndex; i < STATUS_ORDER.length - 1; i++) {
        const statusKey = STATUS_ORDER[i];
        if (statusKey === 'out_for_delivery') {
          totalMinutes += deliveryDuration;
        } else {
          totalMinutes += STATUS_DURATIONS[statusKey] || 0;
        }
      }

      // Subtract elapsed time in current status (rough estimate)
      const adjustedMinutes = Math.max(0, totalMinutes - Math.min(elapsedMinutes, 5));
      setTimeRemaining(Math.ceil(adjustedMinutes));

      // Calculate ETA time
      const eta = new Date(now + adjustedMinutes * 60000);
      setEtaTime(eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };

    calculateETA();
    const interval = setInterval(calculateETA, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [status, orderCreatedAt, deliveryDuration]);

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={32} />;
      case 'confirmed':
        return <CheckCircle2 className="text-blue-500" size={32} />;
      case 'preparing':
        return <ChefHat className="text-orange-500" size={32} />;
      case 'ready':
        return <Package className="text-purple-500" size={32} />;
      case 'out_for_delivery':
        return <Truck className="text-primary" size={32} />;
      case 'delivered':
        return <CheckCircle2 className="text-green-500" size={32} />;
      default:
        return <Clock className="text-muted-foreground" size={32} />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'pending':
        return 'Waiting for confirmation';
      case 'confirmed':
        return 'Order confirmed';
      case 'preparing':
        return 'Preparing your food';
      case 'ready':
        return 'Ready for pickup';
      case 'out_for_delivery':
        return 'On the way';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Processing';
    }
  };

  if (status === 'delivered' || status === 'cancelled') {
    return null;
  }

  return (
    <div className={cn("bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-background rounded-full shadow-sm">
            {getStatusIcon()}
          </div>
          <div>
            <p className="font-semibold text-foreground">{getStatusLabel()}</p>
            <p className="text-sm text-muted-foreground">Estimated arrival</p>
          </div>
        </div>
        {loadingDistance && (
          <Loader2 className="text-muted-foreground animate-spin" size={20} />
        )}
      </div>

      <div className="bg-background rounded-lg p-4 flex items-center justify-between">
        <div className="text-center flex-1">
          <p className="text-3xl font-bold text-primary">{timeRemaining}</p>
          <p className="text-sm text-muted-foreground">minutes</p>
        </div>
        <div className="w-px h-12 bg-border" />
        <div className="text-center flex-1">
          <p className="text-3xl font-bold text-foreground">{etaTime}</p>
          <p className="text-sm text-muted-foreground">arrival time</p>
        </div>
      </div>

      {/* Distance info */}
      {distanceKm !== null && (
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            📍 {distanceKm} km away • ~{deliveryDuration} min drive
            {calculationMethod === 'driving' && ' (route calculated)'}
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Order placed</span>
          <span>Delivered</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ 
              width: `${((STATUS_ORDER.indexOf(status) + 1) / STATUS_ORDER.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {status === 'out_for_delivery' && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-muted-foreground">Driver is heading to your location</span>
        </div>
      )}
    </div>
  );
}
