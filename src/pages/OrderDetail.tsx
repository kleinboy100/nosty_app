import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { OrderStatusTracker } from '@/components/OrderStatusTracker';
import { DeliveryMap } from '@/components/DeliveryMap';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Bell } from 'lucide-react';
import { usePushNotifications, ORDER_STATUS_MESSAGES } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const { permission, requestPermission, showNotification, supported } = usePushNotifications();
  const previousStatus = useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrder();
      const channel = supabase.channel('order-updates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (payload) => {
        const newOrder = payload.new as any;
        
        // Show push notification if status changed
        if (previousStatus.current && previousStatus.current !== newOrder.status) {
          const message = ORDER_STATUS_MESSAGES[newOrder.status];
          if (message) {
            showNotification(message.title, { body: message.body, tag: `order-${id}` });
          }
        }
        previousStatus.current = newOrder.status;
        
        setOrder((prev: any) => ({ ...prev, ...newOrder }));
      }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [id, showNotification]);

  const fetchOrder = async () => {
    const [orderRes, itemsRes] = await Promise.all([
      supabase.from('orders').select('*, restaurants(name, address)').eq('id', id).single(),
      supabase.from('order_items').select('*').eq('order_id', id)
    ]);
    setOrder(orderRes.data);
    setItems(itemsRes.data || []);
    if (orderRes.data) {
      previousStatus.current = orderRes.data.status;
    }
  };

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  if (!order) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;

  const showMap = ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="font-display text-2xl font-bold mb-2">Order Details</h1>
        <p className="text-muted-foreground mb-6">From: {order.restaurants?.name}</p>

        {/* Notification Permission Banner */}
        {supported && permission !== 'granted' && (
          <div className="bg-primary/10 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Bell className="text-primary" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium">Enable notifications</p>
              <p className="text-xs text-muted-foreground">Get alerts when your order status changes</p>
            </div>
            <Button size="sm" onClick={handleEnableNotifications}>Enable</Button>
          </div>
        )}
        
        <div className="card-elevated p-6 mb-6">
          <h2 className="font-semibold mb-4">Order Status</h2>
          <OrderStatusTracker status={order.status} />
        </div>

        {/* Live Delivery Map */}
        {showMap && (
          <div className="card-elevated p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-primary" size={20} />
              <h2 className="font-semibold">Live Delivery Tracking</h2>
            </div>
            <DeliveryMap
              restaurantAddress={order.restaurants?.address}
              deliveryAddress={order.delivery_address}
              status={order.status}
              className="h-64 w-full"
            />
            {order.status === 'out_for_delivery' && (
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Driver is on the way to your location
              </p>
            )}
          </div>
        )}

        <div className="card-elevated p-6">
          <h2 className="font-semibold mb-4">Items</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
              <span>{item.quantity}x {item.item_name}</span>
              <span>R{(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-4 mt-4 border-t">
            <span>Total</span>
            <span>R{Number(order.total_amount).toFixed(2)}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Delivery: {order.delivery_address}</p>
        </div>
      </div>
    </div>
  );
}
