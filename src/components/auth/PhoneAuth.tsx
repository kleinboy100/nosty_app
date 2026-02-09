import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, ArrowRight, CheckCircle, Loader2, User, UserPlus, LogIn } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface PhoneAuthProps {
  onSuccess: () => void;
}

type AuthStep = 'phone_check' | 'signup' | 'login' | 'otp_verify';

export function PhoneAuth({ onSuccess }: PhoneAuthProps) {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('phone_check');
  const [existingUsername, setExistingUsername] = useState<string | null>(null);
  
  const { toast } = useToast();

  const formatPhoneNumber = (input: string) => {
    const digits = input.replace(/\D/g, '');
    
    if (digits.startsWith('0')) {
      return '+27' + digits.slice(1);
    }
    if (digits.startsWith('27')) {
      return '+' + digits;
    }
    if (!input.startsWith('+')) {
      return '+27' + digits;
    }
    return input;
  };

  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      // Check if phone exists in profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profile) {
        // Phone exists, switch to login mode
        setExistingUsername(profile.full_name);
        setStep('login');
        toast({
          title: "Account found",
          description: "Please enter your username to continue"
        });
      } else {
        // Phone doesn't exist, switch to signup mode
        setStep('signup');
        toast({
          title: "New user",
          description: "Create an account to continue"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error checking phone",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: { full_name: username }
        }
      });
      
      if (error) {
        toast({
          title: "Error sending OTP",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setStep('otp_verify');
        toast({
          title: "OTP Sent",
          description: "Check your phone for the verification code"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter your username",
        variant: "destructive"
      });
      return;
    }

    // Verify username matches the stored username
    if (existingUsername && username.trim().toLowerCase() !== existingUsername.toLowerCase()) {
      toast({
        title: "Username mismatch",
        description: "The username doesn't match our records for this phone number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone
      });
      
      if (error) {
        toast({
          title: "Error sending OTP",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setStep('otp_verify');
        toast({
          title: "OTP Sent",
          description: "Check your phone for the verification code"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });
      
      if (error) {
        toast({
          title: "Verification failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // If this was a signup, update the profile with phone number
        if (step === 'otp_verify' && data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              phone: formattedPhone,
              full_name: username || existingUsername 
            })
            .eq('user_id', data.user.id);

          if (profileError) {
            console.error('Profile update error:', profileError);
          }
        }
        
        toast({
          title: "Welcome!",
          description: "You have successfully signed in."
        });
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('phone_check');
    setUsername('');
    setOtp('');
    setExistingUsername(null);
  };

  // OTP Verification Step
  if (step === 'otp_verify') {
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold">Enter verification code</h2>
          <p className="text-muted-foreground text-sm">
            We sent a 6-digit code to <strong>{phone}</strong>
          </p>
        </div>

        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button 
          type="submit" 
          className="w-full btn-primary h-12"
          disabled={loading || otp.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify & Sign In
              <ArrowRight className="ml-2" size={18} />
            </>
          )}
        </Button>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={resetFlow}
            className="text-sm text-primary hover:underline font-medium"
          >
            Use a different number
          </button>
        </div>
      </form>
    );
  }

  // Signup Step
  if (step === 'signup') {
    return (
      <form onSubmit={handleSignup} className="space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold">Create your account</h2>
          <p className="text-muted-foreground text-sm">
            This phone number is not registered yet
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              id="username"
              type="text"
              placeholder="Enter a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signupPhone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              id="signupPhone"
              type="tel"
              value={phone}
              disabled
              className="pl-10 bg-muted"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full btn-primary h-12"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending code...
            </>
          ) : (
            <>
              Sign Up
              <ArrowRight className="ml-2" size={18} />
            </>
          )}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={resetFlow}
            className="text-sm text-primary hover:underline font-medium"
          >
            Use a different number
          </button>
        </div>
      </form>
    );
  }

  // Login Step
  if (step === 'login') {
    return (
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold">Welcome back!</h2>
          <p className="text-muted-foreground text-sm">
            Enter your username to continue
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loginUsername">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              id="loginUsername"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loginPhone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              id="loginPhone"
              type="tel"
              value={phone}
              disabled
              className="pl-10 bg-muted"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full btn-primary h-12"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending code...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2" size={18} />
            </>
          )}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={resetFlow}
            className="text-sm text-primary hover:underline font-medium"
          >
            Use a different number
          </button>
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
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. 082 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pl-10"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          We'll check if you have an account
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full btn-primary h-12"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="ml-2" size={18} />
          </>
        )}
      </Button>
    </form>
  );
}
