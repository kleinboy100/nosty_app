import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Users } from 'lucide-react';

interface StaffMember {
  id: string;
  email: string;
  user_id: string;
  created_at: string;
}

export function StaffManager({ restaurantId }: { restaurantId: string }) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurantId) fetchStaff();
  }, [restaurantId]);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('restaurant_staff')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff:', error);
    } else {
      setStaff(data || []);
    }
  };

  const addStaff = async () => {
    if (!email.trim()) return;
    setLoading(true);

    try {
      // Look up user by email in profiles or auth
      // We need to find the user_id for this email
      // First check if user exists by looking at auth metadata
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(100);

      if (profileError) {
        toast({ title: 'Error', description: 'Could not look up users.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // We need to match by email - check auth users
      // Since we can't query auth.users directly, we'll use a workaround:
      // Try to find the user by checking if they signed up with this email
      // We'll store the email and use an edge function or just try inserting
      
      // For simplicity, we'll look up by email using the admin approach:
      // Store the email and let the system resolve on login
      // But better: use supabase admin to get user by email via edge function
      
      // Simplest secure approach: use an edge function to resolve email -> user_id
      const { data: fnData, error: fnError } = await supabase.functions.invoke('resolve-staff-email', {
        body: { email: email.trim(), restaurant_id: restaurantId }
      });

      if (fnError || !fnData?.success) {
        toast({
          title: 'Error',
          description: fnData?.error || 'Could not add staff member. Make sure the email is registered.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      toast({ title: 'Staff added', description: `${email} has been added as staff.` });
      setEmail('');
      fetchStaff();
    } catch (err) {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const removeStaff = async (staffId: string, staffEmail: string) => {
    const { error } = await supabase
      .from('restaurant_staff')
      .delete()
      .eq('id', staffId);

    if (error) {
      toast({ title: 'Error', description: 'Could not remove staff member.', variant: 'destructive' });
    } else {
      toast({ title: 'Removed', description: `${staffEmail} has been removed.` });
      fetchStaff();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users size={20} className="text-primary" />
        <h3 className="font-semibold text-base">Staff Members</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Add users who can manage orders, stock, and view analytics.
      </p>

      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter staff email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addStaff()}
        />
        <Button onClick={addStaff} disabled={loading || !email.trim()} size="sm">
          <UserPlus size={16} className="mr-1" />
          Add
        </Button>
      </div>

      {staff.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No staff members added yet.</p>
      ) : (
        <div className="space-y-2">
          {staff.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium">{member.email}</p>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(member.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeStaff(member.id, member.email)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
