import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const cuisineTypes = ['Italian', 'Japanese', 'Mexican', 'American', 'Chinese', 'Indian', 'Thai', 'French', 'Mediterranean'];

export default function RestaurantRegister() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', cuisine_type: '', address: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    setLoading(true);
    const { error } = await supabase.from('restaurants').insert({ ...form, owner_id: user.id });
    setLoading(false);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Restaurant registered!' }); navigate('/restaurant/dashboard'); }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-xl">
        <h1 className="font-display text-3xl font-bold mb-8">Register Your Restaurant</h1>
        <form onSubmit={handleSubmit} className="card-elevated p-6 space-y-4">
          <div><Label>Restaurant Name *</Label><Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div><Label>Cuisine Type *</Label>
            <Select required value={form.cuisine_type} onValueChange={v => setForm({...form, cuisine_type: v})}>
              <SelectTrigger><SelectValue placeholder="Select cuisine" /></SelectTrigger>
              <SelectContent>{cuisineTypes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Address *</Label><Input required value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <Button type="submit" className="w-full btn-primary" disabled={loading}>{loading ? 'Registering...' : 'Register Restaurant'}</Button>
        </form>
      </div>
    </div>
  );
}
