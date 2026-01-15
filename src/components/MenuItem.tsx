import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface MenuItemProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
  restaurantId: string;
  restaurantName: string;
}

export function MenuItem({
  id,
  name,
  description,
  price,
  imageUrl,
  restaurantId,
  restaurantName
}: MenuItemProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, restaurantId: cartRestaurantId } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (cartRestaurantId && cartRestaurantId !== restaurantId) {
      toast({
        title: "Cart cleared",
        description: "Items from the previous restaurant were removed.",
        variant: "default"
      });
    }
    
    addItem({
      menuItemId: id,
      name,
      price,
      quantity,
      restaurantId,
      restaurantName
    });
    
    toast({
      title: "Added to cart",
      description: `${quantity}x ${name} added to your cart.`
    });
    
    setQuantity(1);
  };

  return (
    <div className="card-elevated p-4 flex gap-4">
      {imageUrl && (
        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-foreground">{name}</h4>
        {description && (
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
            {description}
          </p>
        )}
        <p className="text-primary font-semibold mt-2">${price.toFixed(2)}</p>
      </div>
      <div className="flex flex-col items-end justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus size={14} />
          </Button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus size={14} />
          </Button>
        </div>
        <Button 
          onClick={handleAddToCart}
          className="btn-primary text-sm"
        >
          Add ${(price * quantity).toFixed(2)}
        </Button>
      </div>
    </div>
  );
}
