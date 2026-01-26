import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { KFCMenuItem } from '@/components/KFCMenuItem';
import { HeroSlideshow } from '@/components/HeroSlideshow';
import { supabase } from '@/integrations/supabase/client';

// Nosty's restaurant ID
const NOSTY_RESTAURANT_ID = '7f5250bb-263f-4bca-a4af-d325f761542b';

interface MenuItemType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
}

interface Restaurant {
  id: string;
  name: string;
}

const mealCategories = ['All', 'Mains', 'Sides', 'Drinks', 'Desserts', 'Combos', 'Specials'];

export default function Index() {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [restaurantRes, menuRes] = await Promise.all([
      supabase.from('restaurants_public').select('id, name').eq('id', NOSTY_RESTAURANT_ID).maybeSingle(),
      supabase.from('menu_items').select('*').eq('restaurant_id', NOSTY_RESTAURANT_ID).eq('is_available', true)
    ]);

    if (restaurantRes.error) {
      console.error('Error fetching restaurant:', restaurantRes.error);
    } else {
      setRestaurant(restaurantRes.data);
    }

    if (menuRes.error) {
      console.error('Error fetching menu:', menuRes.error);
    } else {
      setMenuItems(menuRes.data || []);
    }
    setLoading(false);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get available categories from menu items
  const availableCategories = ['All', ...new Set(menuItems.map(item => item.category))];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Slideshow - Compact KFC-style */}
      <section className="relative h-[225px] md:h-[275px] overflow-hidden">
        <HeroSlideshow />
        <div className="relative container mx-auto px-4 h-full flex flex-col z-10">
          <div className="max-w-xl mt-8">
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-card mb-2 animate-fade-in">
              Fresh & Fast
            </h1>
          </div>
          <div className="absolute bottom-6 left-4 right-4 md:left-4 md:right-auto animate-slide-up">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search meals..."
                className="pl-9 h-10 bg-card border-0 shadow-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters - Sticky like KFC */}
      <section className="py-3 border-b border-border sticky top-16 bg-background z-40">
        <div className="container mx-auto px-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {availableCategories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Items - Dense KFC-style grid */}
      <section className="py-4">
        <div className="container mx-auto px-3">
          <h2 className="font-display text-lg font-bold text-foreground mb-3">
            {selectedCategory === 'All' ? 'Our Menu' : selectedCategory}
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="card-elevated overflow-hidden">
                  <div className="aspect-square bg-muted animate-pulse" />
                  <div className="p-2 space-y-1">
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-base">No meals found</p>
              <p className="text-muted-foreground text-xs mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredItems.map(item => (
                <KFCMenuItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={Number(item.price)}
                  imageUrl={item.image_url}
                  category={item.category}
                  restaurantId={restaurant?.id || NOSTY_RESTAURANT_ID}
                  restaurantName={restaurant?.name || "Nosty's Fresh Fast Food"}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
