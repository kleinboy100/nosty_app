import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, Power } from 'lucide-react';

interface OperatingHoursSettingsProps {
  restaurantId: string;
}

export function OperatingHoursSettings({ restaurantId }: OperatingHoursSettingsProps) {
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [restaurantId]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('restaurants')
      .select('is_accepting_orders, operating_hours_start, operating_hours_end')
      .eq('id', restaurantId)
      .single();

    if (error) {
      console.error('Error fetching operating hours:', error);
      toast.error('Failed to load operating hours');
    } else if (data) {
      setIsAcceptingOrders(data.is_accepting_orders ?? true);
      // Convert time format from "HH:MM:SS" to "HH:MM"
      setOpeningTime(data.operating_hours_start?.slice(0, 5) || '09:00');
      setClosingTime(data.operating_hours_end?.slice(0, 5) || '18:00');
    }
    setLoading(false);
  };

  const handleToggleOrders = async (checked: boolean) => {
    setIsAcceptingOrders(checked);
    setSaving(true);

    const { error } = await supabase
      .from('restaurants')
      .update({ is_accepting_orders: checked })
      .eq('id', restaurantId);

    if (error) {
      toast.error('Failed to update order status');
      setIsAcceptingOrders(!checked);
    } else {
      toast.success(checked ? 'Now accepting orders' : 'Orders disabled');
    }
    setSaving(false);
  };

  const handleSaveHours = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('restaurants')
      .update({
        operating_hours_start: openingTime,
        operating_hours_end: closingTime
      })
      .eq('id', restaurantId);

    if (error) {
      toast.error('Failed to update operating hours');
    } else {
      toast.success('Operating hours updated');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="card-elevated p-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-muted rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Toggle */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Power className={isAcceptingOrders ? 'text-green-500' : 'text-muted-foreground'} size={20} />
            <div>
              <Label htmlFor="accepting-orders" className="font-medium">
                Accept Orders
              </Label>
              <p className="text-sm text-muted-foreground">
                {isAcceptingOrders ? 'Restaurant is open for orders' : 'Orders are currently disabled'}
              </p>
            </div>
          </div>
          <Switch
            id="accepting-orders"
            checked={isAcceptingOrders}
            onCheckedChange={handleToggleOrders}
            disabled={saving}
          />
        </div>
      </div>

      {/* Operating Hours */}
      <div className="card-elevated p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-muted-foreground" />
          <h3 className="font-medium">Operating Hours</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="opening-time" className="text-sm text-muted-foreground">
              Opening Time
            </Label>
            <Input
              id="opening-time"
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="closing-time" className="text-sm text-muted-foreground">
              Closing Time
            </Label>
            <Input
              id="closing-time"
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <Button 
          onClick={handleSaveHours} 
          disabled={saving}
          className="mt-4 w-full"
        >
          {saving ? 'Saving...' : 'Save Hours'}
        </Button>

        <p className="text-xs text-muted-foreground mt-3">
          Orders will only be accepted during these hours when "Accept Orders" is enabled.
        </p>
      </div>
    </div>
  );
}
