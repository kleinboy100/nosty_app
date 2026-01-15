import { useState, useEffect } from 'react';
import { Search, ChefHat } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RestaurantCard } from '@/components/RestaurantCard';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-food.jpg';
import { Link } from 'react-router-dom';

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine_type: string;
  address: string;
  image_url: string | null;
  rating: number;
  average_prep_time: number;
}

const cuisineTypes = ['All', 'Kasi Food', 'Braai & Grill', 'Bunny Chow', 'Pap & Vleis', 'Gatsby', 'Vetkoek', 'Shisanyama', 'Traditional', 'Fast Food'];

export default function Index() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching restaurants:', error);
    } else {
      setRestaurants(data || []);
    }
    setLoading(false);
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === 'All' || restaurant.cuisine_type === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Delicious food"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/40" />
        </div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-card mb-4 animate-fade-in">
              Mzansi flavors,
              <br />
              <span className="text-primary">straight to you</span>
            </h1>
            <p className="text-card/80 text-lg mb-8 animate-fade-in">
              Order from the best local kasi takeaways and restaurants across South Africa.
            </p>
            <div className="flex gap-4 animate-slide-up">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  placeholder="Search takeaways, kasi spots..."
                  className="pl-10 h-12 bg-card border-0 shadow-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Owner CTA */}
      <section className="bg-secondary/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ChefHat className="text-primary" size={32} />
              <div>
                <p className="font-display font-semibold text-foreground">Own a takeaway or restaurant?</p>
                <p className="text-muted-foreground text-sm">Join KasiConnect and reach more customers in your area</p>
              </div>
            </div>
            <Link to="/restaurant/register">
              <Button className="btn-primary">Register Your Takeaway</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cuisine Filters */}
      <section className="py-6 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {cuisineTypes.map(cuisine => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCuisine === cuisine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurants Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">
            {selectedCuisine === 'All' ? 'All Takeaways & Restaurants' : `${selectedCuisine} Spots`}
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-elevated overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted rounded animate-pulse w-full" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No takeaways found</p>
              <p className="text-muted-foreground text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map(restaurant => (
                <RestaurantCard
                  key={restaurant.id}
                  id={restaurant.id}
                  name={restaurant.name}
                  description={restaurant.description}
                  cuisineType={restaurant.cuisine_type}
                  address={restaurant.address}
                  imageUrl={restaurant.image_url}
                  rating={Number(restaurant.rating)}
                  averagePrepTime={restaurant.average_prep_time}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
