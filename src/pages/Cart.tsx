import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { supabase } from '@/integrations/supabase/client';

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, total, restaurantId } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { permission, requestPermission, supported } = usePushNotifications();
  
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: "Notifications enabled",
        description: "You'll receive updates about your order status."
      });
    } else {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive"
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place an order.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!deliveryAddress.trim()) {
      toast({
        title: "Delivery address required",
        description: "Please enter your delivery address.",
        variant: "destructive"
      });
      return;
    }

    if (!restaurantId || items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to your cart before placing an order.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create order with pending status - payment method will be selected after restaurant approval
      const { data: orderId, error: orderError } = await supabase.rpc('create_validated_order', {
        p_restaurant_id: restaurantId,
        p_delivery_address: deliveryAddress,
        p_notes: notes || null,
        p_payment_method: 'cash', // Default to cash, will be updated after approval
        p_items: items.map(item => ({
          menu_item_id: item.menuItemId,
          quantity: item.quantity
        }))
      });

      if (orderError) {
        console.error('Order error:', orderError);
        toast({
          title: "Order Failed",
          description: orderError.message || "Failed to place order. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (!orderId) {
        toast({
          title: "Order Failed",
          description: "Failed to create order. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      clearCart();
      toast({
        title: "Order submitted!",
        description: "Waiting for the restaurant to confirm your order."
      });
      navigate(`/orders/${orderId}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error placing order",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some delicious items to get started</p>
          <Button onClick={() => navigate('/')} className="btn-primary">
            <ArrowLeft size={18} className="mr-2" />
            Browse Restaurants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} className="mr-2" />
          Continue Shopping
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <h1 className="font-display text-2xl font-bold text-foreground mb-6">Your Cart</h1>
            <p className="text-muted-foreground mb-4">From: {items[0]?.restaurantName}</p>
            
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="card-elevated p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <p className="text-primary font-semibold">R{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                  <p className="font-semibold text-foreground w-20 text-right">
                    R{(item.price * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card-elevated p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold text-foreground mb-6">Order Summary</h2>
              
              {/* Notification Permission */}
              {supported && permission !== 'granted' && (
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Bell className="text-primary mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Enable order notifications</p>
                      <p className="text-xs text-muted-foreground mb-2">Get updates when your order status changes</p>
                      <Button size="sm" variant="outline" onClick={handleEnableNotifications}>
                        Enable Notifications
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label>Delivery Address *</Label>
                  <AddressAutocomplete
                    value={deliveryAddress}
                    onChange={setDeliveryAddress}
                    onCoordinatesChange={setDeliveryCoords}
                    placeholder="Search for your address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Info about payment */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    💡 You'll choose your payment method after the restaurant confirms your order.
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>R25.00</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span>R{(total + 25).toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full btn-primary h-12"
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
