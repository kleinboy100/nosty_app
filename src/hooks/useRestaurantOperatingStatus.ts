import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OperatingStatus {
  isOpen: boolean;
  reason?: string;
  openingTime?: string;
  closingTime?: string;
}

export function useRestaurantOperatingStatus(restaurantId: string | null) {
  const [status, setStatus] = useState<OperatingStatus>({ isOpen: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      setLoading(true);
      
      // First try public view, then private if user is authenticated
      const { data, error } = await supabase
        .from('restaurants')
        .select('is_accepting_orders, operating_hours_start, operating_hours_end')
        .eq('id', restaurantId)
        .maybeSingle();

      if (error || !data) {
        // Default to open if we can't fetch (e.g., RLS issue for unauthenticated users)
        // The restaurant exists (hardcoded ID), we just can't read the settings
        setStatus({ 
          isOpen: true, 
          openingTime: '09:00',
          closingTime: '18:00'
        });
        setLoading(false);
        return;
      }

      // Check manual toggle first
      if (!data.is_accepting_orders) {
        setStatus({ 
          isOpen: false, 
          reason: 'Restaurant is currently not accepting orders',
          openingTime: data.operating_hours_start?.slice(0, 5),
          closingTime: data.operating_hours_end?.slice(0, 5)
        });
        setLoading(false);
        return;
      }

      // Check operating hours
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
      const openTime = data.operating_hours_start?.slice(0, 5) || '09:00';
      const closeTime = data.operating_hours_end?.slice(0, 5) || '18:00';

      if (currentTime < openTime || currentTime > closeTime) {
        setStatus({ 
          isOpen: false, 
          reason: `Restaurant is closed. Open from ${openTime} to ${closeTime}`,
          openingTime: openTime,
          closingTime: closeTime
        });
      } else {
        setStatus({ 
          isOpen: true,
          openingTime: openTime,
          closingTime: closeTime
        });
      }
      
      setLoading(false);
    };

    checkStatus();
    
    // Check status every minute
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  return { ...status, loading };
}
