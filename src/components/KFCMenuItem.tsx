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
    <div className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
      {/* Image Container - Square with gradient overlay */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl || defaultImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full font-bold text-sm shadow-lg">
          R{price.toFixed(0)}
        </div>
        {/* Add Button - Floating */}
        <Button
          onClick={handleAddToCart}
          size="icon"
          className="absolute bottom-3 right-3 h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg transform group-hover:scale-110 transition-transform"
        >
          <Plus size={24} className="text-primary-foreground" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h4 className="font-display font-bold text-foreground text-lg leading-tight mb-1 line-clamp-1">
          {name}
        </h4>
        {description && (
          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}