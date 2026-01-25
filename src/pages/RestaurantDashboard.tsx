import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantOrderCard } from '@/components/RestaurantOrderCard';
import { YocoSettings } from '@/components/YocoSettings';
import { MenuManager } from '@/components/MenuManager';
import { Plus, Store, Bell, Volume2, Settings, UtensilsCrossed } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const { permission, requestPermission, showNotification, supported } = usePushNotifications();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) fetchRestaurants();
  }, [user]);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchOrders();
      
      // Subscribe to realtime order updates
      const channel = supabase
        .channel('restaurant-orders')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${selectedRestaurant}`
        }, (payload) => {
          const newOrder = payload.new as any;
          // Mark as new order
          setNewOrderIds(prev => new Set([...prev, newOrder.id]));
          
          // Play notification sound
          playNotificationSound();
          
          // Show push notification
          showNotification('🔔 New Order!', {
            body: `New order #${newOrder.id.slice(0, 8)} received. Total: R${Number(newOrder.total_amount).toFixed(2)}`,
            tag: `new-order-${newOrder.id}`,
            requireInteraction: true
          });
          
          // Fetch orders to include order_items
          fetchOrders();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${selectedRestaurant}`
        }, () => {
          fetchOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedRestaurant, showNotification]);

  const playNotificationSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleToZ');
    }
    audioRef.current.play().catch(() => {});
  };

  const fetchRestaurants = async () => {
    const { data } = await supabase.from('restaurants').select('*').eq('owner_id', user?.id);
    setRestaurants(data || []);
    if (data?.[0]) setSelectedRestaurant(data[0].id);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', selectedRestaurant)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    // Remove from new orders when acted upon
    setNewOrderIds(prev => {
      const updated = new Set(prev);
      updated.delete(orderId);
      return updated;
    });
    fetchOrders();
  };

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Please sign in.</p>
    </div>
  );

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-2xl font-bold">Restaurant Dashboard</h1>
          <Link to="/restaurant/register">
            <Button className="btn-primary">
              <Plus size={18} className="mr-2" />
              Add Restaurant
            </Button>
          </Link>
        </div>

        {restaurants.length === 0 ? (
          <div className="text-center py-12 card-elevated">
            <Store size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No restaurants yet</p>
            <Link to="/restaurant/register">
              <Button className="btn-primary">Register Your First Restaurant</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Restaurant Selector & Notifications */}
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {supported && permission !== 'granted' && (
                <Button variant="outline" onClick={handleEnableNotifications}>
                  <Bell size={16} className="mr-2" />
                  Enable Notifications
                </Button>
              )}

              {permission === 'granted' && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Volume2 size={16} />
                  Notifications enabled
                </span>
              )}
            </div>

            {/* Order Tabs */}
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="pending" className="relative">
                  New Orders
                  {pendingOrders.length > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {pendingOrders.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active">
                  Active
                  {activeOrders.length > 0 && (
                    <span className="ml-2 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {activeOrders.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="menu">
                  <UtensilsCrossed size={16} className="mr-1" />
                  Menu
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings size={16} className="mr-1" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-12 card-elevated">
                    <p className="text-muted-foreground">No pending orders</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingOrders.map(order => (
                      <RestaurantOrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={updateStatus}
                        isNew={newOrderIds.has(order.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-12 card-elevated">
                    <p className="text-muted-foreground">No active orders</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.map(order => (
                      <RestaurantOrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={updateStatus}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completedOrders.length === 0 ? (
                  <div className="text-center py-12 card-elevated">
                    <p className="text-muted-foreground">No completed orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedOrders.slice(0, 20).map(order => (
                      <RestaurantOrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={updateStatus}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="menu">
                <MenuManager restaurantId={selectedRestaurant} />
              </TabsContent>
              <TabsContent value="settings">
                <div className="max-w-xl">
                  <h2 className="font-semibold text-lg mb-4">Payment Settings</h2>
                  <YocoSettings restaurantId={selectedRestaurant} />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}