import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OrderChat } from './OrderChat';
import { Check, X, ChefHat, Package, Truck, Home, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  quantity: number;
  item_name: string;
  price: number;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  notes?: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface RestaurantOrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, status: string) => Promise<void>;
  isNew?: boolean;
}

const statusFlow = [
  { status: 'confirmed', label: 'Accept Order', icon: Check, color: 'bg-green-500 hover:bg-green-600' },
  { status: 'preparing', label: 'Start Preparing', icon: ChefHat, color: 'bg-orange-500 hover:bg-orange-600' },
  { status: 'ready', label: 'Ready for Pickup', icon: Package, color: 'bg-blue-500 hover:bg-blue-600' },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-purple-500 hover:bg-purple-600' },
  { status: 'delivered', label: 'Mark Delivered', icon: Home, color: 'bg-green-600 hover:bg-green-700' },
];

const getNextAction = (currentStatus: string) => {
  const currentIndex = statusFlow.findIndex(s => s.status === currentStatus);
  if (currentStatus === 'pending') return statusFlow[0]; // Accept order
  if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
    return statusFlow[currentIndex + 1];
  }
  return null;
};

export function RestaurantOrderCard({ order, onUpdateStatus, isNew }: RestaurantOrderCardProps) {
  const [loading, setLoading] = useState(false);
  const nextAction = getNextAction(order.status);

  const handleAction = async (status: string) => {
    setLoading(true);
    await onUpdateStatus(order.id, status);
    setLoading(false);
  };

  const handleDecline = async () => {
    setLoading(true);
    await onUpdateStatus(order.id, 'cancelled');
    setLoading(false);
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className={cn(
      "card-elevated p-4 transition-all",
      isNew && "ring-2 ring-primary animate-pulse-slow"
    )}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
            {isNew && (
              <span className="flex items-center gap-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                <Bell size={12} />
                New Order
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <span className={cn(
          "px-2 py-1 rounded text-xs font-medium",
          order.status === 'pending' && "bg-yellow-100 text-yellow-800",
          order.status === 'confirmed' && "bg-blue-100 text-blue-800",
          order.status === 'preparing' && "bg-orange-100 text-orange-800",
          order.status === 'ready' && "bg-green-100 text-green-800",
          order.status === 'out_for_delivery' && "bg-purple-100 text-purple-800",
          order.status === 'delivered' && "bg-green-200 text-green-900",
          order.status === 'cancelled' && "bg-red-100 text-red-800"
        )}>
          {formatStatus(order.status)}
        </span>
      </div>

      {/* Order Items */}
      <div className="bg-muted/50 rounded-lg p-3 mb-3">
        <p className="text-sm font-medium mb-2">Items:</p>
        {order.order_items?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-1">
            <span>{item.quantity}x {item.item_name}</span>
            <span className="text-muted-foreground">R{(Number(item.price) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>R{Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {/* Delivery Address */}
      <p className="text-sm mb-3">
        <span className="text-muted-foreground">Delivery: </span>
        {order.delivery_address}
      </p>

      {/* Notes */}
      {order.notes && (
        <p className="text-sm mb-3 bg-yellow-50 p-2 rounded">
          <span className="font-medium">Notes: </span>
          {order.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t">
        <div className="flex gap-2">
          {order.status === 'pending' && (
            <>
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => handleAction('confirmed')}
                disabled={loading}
              >
                <Check size={16} className="mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDecline}
                disabled={loading}
              >
                <X size={16} className="mr-1" />
                Decline
              </Button>
            </>
          )}

          {order.status !== 'pending' && 
           order.status !== 'delivered' && 
           order.status !== 'cancelled' && 
           nextAction && (
            <Button
              size="sm"
              className={cn("text-white", nextAction.color)}
              onClick={() => handleAction(nextAction.status)}
              disabled={loading}
            >
              <nextAction.icon size={16} className="mr-1" />
              {nextAction.label}
            </Button>
          )}
        </div>

        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <OrderChat orderId={order.id} userType="restaurant" />
        )}
      </div>
    </div>
  );
}