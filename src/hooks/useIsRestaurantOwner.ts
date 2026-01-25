import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useIsRestaurantOwner() {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOwnership = async () => {
      if (!user) {
        setIsOwner(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        if (error) {
          console.error('Error checking restaurant ownership:', error);
          setIsOwner(false);
        } else {
          setIsOwner(data && data.length > 0);
        }
      } catch (error) {
        console.error('Error checking restaurant ownership:', error);
        setIsOwner(false);
      } finally {
        setLoading(false);
      }
    };

    checkOwnership();
  }, [user]);

  return { isOwner, loading };
}
