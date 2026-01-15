import { Check, Clock, ChefHat, Package, Truck, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

interface OrderStatusTrackerProps {
  status: OrderStatus;
  className?: string;
}

const steps = [
  { status: 'pending', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: Check },
  { status: 'preparing', label: 'Preparing', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: Package },
  { status: 'out_for_delivery', label: 'On the Way', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Home },
];

export function OrderStatusTracker({ status, className }: OrderStatusTrackerProps) {
  if (status === 'cancelled') {
    return (
      <div className={cn("bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center", className)}>
        <p className="text-destructive font-medium">Order Cancelled</p>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex(s => s.status === status);

  return (
    <div className={cn("py-4", className)}>
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted mx-8">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.status} className="flex flex-col items-center">
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20 animate-pulse-slow"
                  )}
                >
                  <Icon size={20} />
                </div>
                <span 
                  className={cn(
                    "text-xs mt-2 font-medium text-center max-w-[60px]",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
