import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Eye, EyeOff, ExternalLink, Check, AlertCircle } from 'lucide-react';

interface YocoSettingsProps {
  restaurantId: string;
}

export function YocoSettings({ restaurantId }: YocoSettingsProps) {
  const { toast } = useToast();
  const [secretKey, setSecretKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasExistingKeys, setHasExistingKeys] = useState(false);
  const [checkingKeys, setCheckingKeys] = useState(true);

  useEffect(() => {
    checkExistingKeys();
  }, [restaurantId]);

  const checkExistingKeys = async () => {
    try {
      // Use server-side function to check if keys are configured (without exposing them)
      const { data: hasKeys } = await supabase
        .rpc('owner_has_payment_keys', { p_restaurant_id: restaurantId });
      setHasExistingKeys(!!hasKeys);
    } catch (error) {
      console.error('Error checking keys:', error);
    } finally {
      setCheckingKeys(false);
    }
  };

  const handleSave = async () => {
    if (!secretKey.trim()) {
      toast({
        title: "Secret key required",
        description: "Please enter your Yoco secret key.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          yoco_secret_key: secretKey,
          yoco_public_key: publicKey || null,
        })
        .eq('id', restaurantId);

      if (error) throw error;

      toast({
        title: "Settings saved!",
        description: "Your Yoco payment settings have been updated."
      });
      setHasExistingKeys(true);
      setSecretKey('');
    } catch (error) {
      console.error('Error saving Yoco settings:', error);
      toast({
        title: "Error saving settings",
        description: "Could not save your payment settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          yoco_secret_key: null,
          yoco_public_key: null,
        })
        .eq('id', restaurantId);

      if (error) throw error;

      toast({
        title: "Payment settings removed",
        description: "Online payments have been disabled for your restaurant."
      });
      setHasExistingKeys(false);
      setSecretKey('');
      setPublicKey('');
    } catch (error) {
      console.error('Error removing Yoco settings:', error);
      toast({
        title: "Error",
        description: "Could not remove payment settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingKeys) {
    return (
      <div className="animate-pulse bg-muted rounded-lg h-32" />
    );
  }

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Online Payments (Yoco)</h3>
          <p className="text-sm text-muted-foreground">Accept card payments from customers</p>
        </div>
      </div>

      {hasExistingKeys ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">Online payments enabled</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Customers can now pay online when ordering from your restaurant. 
            Payments will go directly to your Yoco account.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRemove} disabled={loading}>
              Disable Online Payments
            </Button>
            <Button variant="outline" size="sm" onClick={() => setHasExistingKeys(false)}>
              Update Keys
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Setup required</p>
              <p className="text-muted-foreground">Enter your Yoco API keys to enable online payments.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="secret-key">Secret Key *</Label>
              <div className="relative">
                <Input
                  id="secret-key"
                  type={showSecret ? "text" : "password"}
                  placeholder="sk_live_..."
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="public-key">Public Key (optional)</Label>
              <Input
                id="public-key"
                placeholder="pk_live_..."
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Get your API keys from</span>
            <a 
              href="https://portal.yoco.co.za/settings/developer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Yoco Developer Portal
              <ExternalLink size={14} />
            </a>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Payment Settings'}
          </Button>
        </div>
      )}
    </div>
  );
}