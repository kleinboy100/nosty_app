import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, ArrowRight, Loader2, User, UserPlus, LogIn, Lock } from 'lucide-react';

interface PhoneAuthProps {
  onSuccess: () => void;
}

type AuthStep = 'phone_check' | 'signup' | 'login';

export function PhoneAuth({ onSuccess }: PhoneAuthProps) {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('phone_check');
  const [existingUsername, setExistingUsername] = useState<string | null>(null);

  const { toast } = useToast();

  const formatPhoneNumber = (input: string) => {
    const digits = input.replace(/\D/g, '');
    if (digits.startsWith('0')) return '+27' + digits.slice(1);
    if (digits.startsWith('27')) return '+' + digits;
    if (!input.startsWith('+')) return '+27' + digits;
    return input;
  };

  // Generate a deterministic email from phone number for Supabase auth
  const phoneToEmail = (formattedPhone: string) => {
    const digits = formattedPhone.replace(/\D/g, '');
    return `phone_${digits}@nosty.local`;
  };

  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast({ title: "Phone number required", description: "Please enter your phone number", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (profile) {
        setExistingUsername(profile.full_name);
        setStep('login');
        toast({ title: "Account found", description: "Enter your credentials to sign in" });
      } else {
        setStep('signup');
        toast({ title: "New user", description: "Create an account to continue" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({ title: "Username required", description: "Please enter a username", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== repeatPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure your passwords match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const generatedEmail = phoneToEmail(formattedPhone);

      const { data, error } = await supabase.auth.signUp({
        email: generatedEmail,
        password,
        options: {
          data: { full_name: username.trim() }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with phone number
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone: formattedPhone, full_name: username.trim() })
          .eq('user_id', data.user.id);

        if (profileError) console.error('Profile update error:', profileError);

        toast({ title: "Account created!", description: "You are now signed in." });
        onSuccess();
      }
    } catch (error: any) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({ title: "Username required", description: "Please enter your username", variant: "destructive" });
      return;
    }
    if (!password.trim()) {
      toast({ title: "Password required", description: "Please enter your password", variant: "destructive" });
      return;
    }

    // Verify username matches
    if (existingUsername && username.trim().toLowerCase() !== existingUsername.toLowerCase()) {
      toast({ title: "Username mismatch", description: "The username doesn't match our records for this phone number", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const generatedEmail = phoneToEmail(formattedPhone);

      const { error } = await supabase.auth.signInWithPassword({
        email: generatedEmail,
        password,
      });

      if (error) throw error;

      toast({ title: "Welcome back!", description: "You have successfully signed in." });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('phone_check');
    setUsername('');
    setPassword('');
    setRepeatPassword('');
    setExistingUsername(null);
  };

  // Signup Step
  if (step === 'signup') {
    return (
      <form onSubmit={handleSignup} className="space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-semibold">Create your account</h2>
          <p className="text-muted-foreground text-sm">This phone number is not registered yet</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input id="username" placeholder="Enter a username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signupPhone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input id="signupPhone" type="tel" value={phone} disabled className="pl-10 bg-muted" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signupPassword">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input id="signupPassword" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repeatPassword">Repeat Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input id="repeatPassword" type="password" placeholder="Repeat your password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} className="pl-10" required minLength={6} />
          </div>
        </div>

        <Button type="submit" className="w-full btn-primary h-12" disabled={loading}>
          {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>) : (<>Sign Up<ArrowRight className="ml-2" size={18} /></>)}
        </Button>

        <div className="text-center">
          <button type="button" onClick={resetFlow} className="text-sm text-primary hover:underline font-medium">Use a different number</button>
        </div>
      </form>
    );
  }

  // Login Step
  if (step === 'login') {
    return (
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-semibold">Welcome back!</h2>
          <p className="text-muted-foreground text-sm">Enter your credentials to sign in</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loginUsername">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input id="loginUsername" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loginPhone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input id="loginPhone" type="tel" value={phone} disabled className="pl-10 bg-muted" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loginPassword">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input id="loginPassword" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required />
          </div>
        </div>

        <Button type="submit" className="w-full btn-primary h-12" disabled={loading}>
          {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>) : (<>Sign In<ArrowRight className="ml-2" size={18} /></>)}
        </Button>

        <div className="text-center">
          <button type="button" onClick={resetFlow} className="text-sm text-primary hover:underline font-medium">Use a different number</button>
        </div>
      </form>
    );
  }

  // Initial Phone Check Step
  return (
    <form onSubmit={handleCheckPhone} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input id="phone" type="tel" placeholder="e.g. 082 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" required />
        </div>
        <p className="text-xs text-muted-foreground">We'll check if you have an account</p>
      </div>

      <Button type="submit" className="w-full btn-primary h-12" disabled={loading}>
        {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking...</>) : (<>Continue<ArrowRight className="ml-2" size={18} /></>)}
      </Button>
    </form>
  );
}
