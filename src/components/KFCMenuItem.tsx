import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface KFCMenuItemProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
  restaurantId: string;
  restaurantName: string;
}

export function KFCMenuItem({
  id,
  name,
  description,
  price,
  imageUrl,
  restaurantId,
  restaurantName
}: KFCMenuItemProps) {
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
      quantity: 1,
      restaurantId,
      restaurantName
    });
    
    toast({
      title: "Added to cart",
      description: `${name} added to your cart.`
    });
  };

  const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Image Container - Compact square */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl || defaultImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        {/* Price Badge - Smaller */}
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold text-xs shadow">
          R{price.toFixed(0)}
        </div>
        {/* Add Button - Floating, smaller */}
        <Button
          onClick={handleAddToCart}
          size="icon"
          className="absolute bottom-2 right-2 h-9 w-9 rounded-full bg-primary hover:bg-primary/90 shadow transform group-hover:scale-105 transition-transform"
        >
          <Plus size={18} className="text-primary-foreground" />
        </Button>
      </div>
      
      {/* Content - More compact */}
      <div className="p-2">
        <h4 className="font-display font-bold text-foreground text-sm leading-tight line-clamp-1">
          {name}
        </h4>
        {description && (
          <p className="text-muted-foreground text-xs line-clamp-1 mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}