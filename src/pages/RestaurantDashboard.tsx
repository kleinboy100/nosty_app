import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Store } from 'lucide-react';

const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');

  useEffect(() => { if (user) fetchRestaurants(); }, [user]);
  useEffect(() => { if (selectedRestaurant) fetchOrders(); }, [selectedRestaurant]);

  const fetchRestaurants = async () => {
    const { data } = await supabase.from('restaurants').select('*').eq('owner_id', user?.id);
    setRestaurants(data || []);
    if (data?.[0]) setSelectedRestaurant(data[0].id);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*, order_items(*)').eq('restaurant_id', selectedRestaurant).order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    fetchOrders();
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><p>Please sign in.</p></div>;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-2xl font-bold">Restaurant Dashboard</h1>
          <Link to="/restaurant/register"><Button className="btn-primary"><Plus size={18} className="mr-2" />Add Restaurant</Button></Link>
        </div>
        {restaurants.length === 0 ? (
          <div className="text-center py-12 card-elevated">
            <Store size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No restaurants yet</p>
            <Link to="/restaurant/register"><Button className="btn-primary">Register Your First Restaurant</Button></Link>
          </div>
        ) : (
          <>
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-64 mb-6"><SelectValue /></SelectTrigger>
              <SelectContent>{restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
            <h2 className="font-semibold mb-4">Orders ({orders.length})</h2>
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="card-elevated p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">Order #{order.id.slice(0,8)}</p>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                      <p className="text-sm mt-1">Delivery: {order.delivery_address}</p>
                    </div>
                    <Select value={order.status} onValueChange={s => updateStatus(order.id, s)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm">{order.order_items?.map((i: any) => <span key={i.id} className="mr-2">{i.quantity}x {i.item_name}</span>)}</div>
                  <p className="font-semibold mt-2">Total: ${Number(order.total_amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
