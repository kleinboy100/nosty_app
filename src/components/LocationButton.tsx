import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';

interface LocationButtonProps {
  onLocationReceived: (address: string) => void;
}

export function LocationButton({ onLocationReceived }: LocationButtonProps) {
  const { loading, error, getCurrentLocation } = useGeolocation();
  const { toast } = useToast();

  const handleClick = async () => {
    const address = await getCurrentLocation();
    if (address) {
      onLocationReceived(address);
      toast({
        title: "Location found",
        description: "Your current location has been set as the delivery address."
      });
    } else if (error) {
      toast({
        title: "Location error",
        description: error,
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <MapPin size={16} />
      )}
      {loading ? 'Getting location...' : 'Use current location'}
    </Button>
  );
}
