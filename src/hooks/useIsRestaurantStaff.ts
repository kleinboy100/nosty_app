import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useIsRestaurantStaff() {
  const { user } = useAuth();
  const [isStaff, setIsStaff] = useState(false);
  const [staffRestaurantId, setStaffRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setIsStaff(false);
        setStaffRestaurantId(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('restaurant_staff')
          .select('restaurant_id')
          .eq('user_id', user.id)
          .limit(1);

        if (error) {
          console.error('Error checking staff status:', error);
          setIsStaff(false);
        } else {
          setIsStaff(data && data.length > 0);
          setStaffRestaurantId(data?.[0]?.restaurant_id ?? null);
        }
      } catch (error) {
        console.error('Error checking staff status:', error);
        setIsStaff(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [user]);

  return { isStaff, staffRestaurantId, loading };
}
