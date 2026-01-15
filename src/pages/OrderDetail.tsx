import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { OrderStatusTracker } from '@/components/OrderStatusTracker';
import { supabase } from '@/integrations/supabase/client';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchOrder();
      const channel = supabase.channel('order-updates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (payload) => setOrder((prev: any) => ({ ...prev, ...payload.new }))).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [id]);

  const fetchOrder = async () => {
    const [orderRes, itemsRes] = await Promise.all([
      supabase.from('orders').select('*, restaurants(name)').eq('id', id).single(),
      supabase.from('order_items').select('*').eq('order_id', id)
    ]);
    setOrder(orderRes.data);
    setItems(itemsRes.data || []);
  };

  if (!order) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="font-display text-2xl font-bold mb-2">Order Details</h1>
        <p className="text-muted-foreground mb-6">From: {order.restaurants?.name}</p>
        <div className="card-elevated p-6 mb-6">
          <h2 className="font-semibold mb-4">Order Status</h2>
          <OrderStatusTracker status={order.status} />
        </div>
        <div className="card-elevated p-6">
          <h2 className="font-semibold mb-4">Items</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
              <span>{item.quantity}x {item.item_name}</span>
              <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-4 mt-4 border-t">
            <span>Total</span>
            <span>${Number(order.total_amount).toFixed(2)}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Delivery: {order.delivery_address}</p>
        </div>
      </div>
    </div>
  );
}
