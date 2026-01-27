import { useState, useEffect, useCallback } from 'react';
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

  const checkStatus = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    // Query from public view - accessible to all users including anonymous
    const { data, error } = await supabase
      .from('restaurants_public')
      .select('is_accepting_orders')
      .eq('id', restaurantId)
      .maybeSingle();

    if (error || !data) {
      // Default to closed if we can't fetch the restaurant
      setStatus({ 
        isOpen: false, 
        reason: 'Unable to check restaurant status'
      });
      setLoading(false);
      return;
    }

    // Status is controlled purely by the toggle
    setStatus({ 
      isOpen: data.is_accepting_orders ?? false
    });
    
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    checkStatus();
    
    // Subscribe to realtime changes on the restaurants table
    const channel = supabase
      .channel(`restaurant-status-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
          filter: `id=eq.${restaurantId}`
        },
        () => {
          // Re-fetch status when restaurant is updated
          checkStatus();
        }
      )
      .subscribe();
    
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, checkStatus]);

  return { ...status, loading };
}
