import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Store, Mail, Phone, MapPin, Save, LogOut, Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
}

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine_type: string;
  address: string;
  phone: string | null;
}

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isRestaurantOwner, setIsRestaurantOwner] = useState(false);
  
  // Editable fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchProfileData();
    }
  }, [user, authLoading, navigate]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      }

      // Fetch restaurants owned by user
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, name, description, cuisine_type, address, phone')
        .eq('owner_id', user.id);

      if (restaurantsError) {
        console.error('Restaurants fetch error:', restaurantsError);
      }

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
        setPhone(profileData.phone || '');
        setAddress(profileData.address || '');
      } else {
        // Initialize with user metadata if no profile exists
        setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      }

      if (restaurantsData && restaurantsData.length > 0) {
        setRestaurants(restaurantsData);
        setIsRestaurantOwner(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone,
            address,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: fullName,
            phone,
            address
          });

        if (error) throw error;
      }

      toast({ title: 'Profile updated', description: 'Your profile has been saved successfully.' });
      fetchProfileData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-6 md:py-8 pb-24 md:pb-8 animate-fade-in">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your account information</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2 rounded-xl">
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>

        {/* Account Information */}
        <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <User size={18} className="text-primary" />
              </div>
              Account Information
            </CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail size={14} />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="mt-1.5 bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User size={14} />
                Full Name
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone size={14} />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 011 123 4567"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin size={14} />
                 {isRestaurantOwner ? 'Restaurant Address' : 'Delivery Address'}
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                 placeholder={isRestaurantOwner ? 'Enter restaurant address' : 'Enter your delivery address'}
                className="mt-1.5"
              />
            </div>

            <Button 
              onClick={handleSaveProfile} 
              disabled={saving}
              className="w-full sm:w-auto btn-primary mt-4 rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Restaurant Owner Section */}
        {isRestaurantOwner && restaurants.length > 0 && (
          <>
            <Separator className="my-8" />
            
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Store size={18} className="text-primary" />
                  </div>
                  My Restaurants
                </CardTitle>
                <CardDescription>Restaurants registered under your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {restaurants.map((restaurant) => (
                  <div 
                    key={restaurant.id} 
                    className="p-5 rounded-2xl border border-border/50 bg-muted/30 space-y-3 hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div>
                      <h3 className="font-display font-bold text-base">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground">{restaurant.cuisine_type}</p>
                    </div>
                    
                    {restaurant.description && (
                      <p className="text-sm text-foreground/80">{restaurant.description}</p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {restaurant.address}
                      </span>
                      {restaurant.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone size={14} />
                          {restaurant.phone}
                        </span>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/restaurant/dashboard')}
                      className="mt-3 rounded-xl"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
