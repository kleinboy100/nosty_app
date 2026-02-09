import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Loader2, PhoneOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CallRestaurantButtonProps {
  orderId: string;
  orderStatus: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function CallRestaurantButton({ 
  orderId, 
  orderStatus,
  className = '',
  variant = 'outline',
  size = 'default'
}: CallRestaurantButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phoneData, setPhoneData] = useState<{ phone: string; restaurantName: string } | null>(null);
  const { toast } = useToast();

  // Check if order status allows calling
  const callableStatuses = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "awaiting_payment"];
  const canCall = callableStatuses.includes(orderStatus);

  const handleCallClick = async () => {
    if (!canCall) {
      toast({
        title: "Cannot call",
        description: "Calling is only available for active orders",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-restaurant-phone', {
        body: { orderId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get restaurant phone');
      }

      if (!data?.phone) {
        throw new Error('Restaurant phone not available');
      }

      setPhoneData(data);
      setShowConfirm(true);
    } catch (error: any) {
      console.error('Error fetching restaurant phone:', error);
      toast({
        title: "Unable to call",
        description: error.message || "Could not retrieve restaurant contact information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateCall = () => {
    if (phoneData?.phone) {
      // Format phone number for tel: protocol
      const cleanPhone = phoneData.phone.replace(/\s+/g, '');
      window.location.href = `tel:${cleanPhone}`;
      setShowConfirm(false);
      
      toast({
        title: "Calling restaurant",
        description: `Connecting you to ${phoneData.restaurantName}`,
      });
    }
  };

  if (!canCall) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={`text-muted-foreground ${className}`}
        disabled
      >
        <PhoneOff size={16} className="mr-2" />
        Call unavailable
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleCallClick}
        disabled={loading}
        className={`${className}`}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Phone size={16} className="mr-2" />
            Call Restaurant
          </>
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Call {phoneData?.restaurantName}?</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to call the restaurant about your order. 
              This will open your phone's dialer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={initiateCall} className="bg-primary">
              <Phone size={16} className="mr-2" />
              Call Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
