import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, User, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface EmailAuthProps {
  onSuccess: () => void;
}

type AuthStep = 'credentials' | 'verify-otp';

export function EmailAuth({ onSuccess }: EmailAuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<AuthStep>('credentials');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login flow - direct sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          toast({
            title: "Error signing in",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in."
          });
          onSuccess();
        }
      } else {
        // Signup flow - send OTP for email verification
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName }
          }
        });
        
        if (error) {
          toast({
            title: "Error signing up",
            description: error.message,
            variant: "destructive"
          });
        } else {
          // Send OTP for verification
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: false
            }
          });
          
          if (otpError) {
            // If OTP fails, the account might already be verified
            // Try to sign in directly
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (signInError) {
              toast({
                title: "Account created",
                description: "Please check your email for verification link."
              });
            } else {
              toast({
                title: "Account created!",
                description: "You can now start ordering food."
              });
              onSuccess();
            }
          } else {
            toast({
              title: "Verification code sent!",
              description: "Please check your email for the OTP code."
            });
            setStep('verify-otp');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code sent to your email.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) {
        toast({
          title: "Verification failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account verified!",
          description: "You can now start ordering food."
        });
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Code resent!",
          description: "Please check your email for the new code."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify-otp') {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setStep('credentials')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2">Verify your email</h3>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <strong>{email}</strong>
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
          className="w-full btn-primary h-12"
          onClick={handleVerifyOtp}
          disabled={loading || otp.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading}
            className="text-primary hover:underline font-medium text-sm disabled:opacity-50"
          >
            Didn't receive the code? Resend
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isLogin && (
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10"
              required={!isLogin}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
            minLength={6}
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
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading...
          </>
        ) : (
          <>
            {isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight className="ml-2" size={18} />
          </>
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary hover:underline font-medium text-sm"
        >
          {isLogin 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"}
        </button>
      </div>
    </form>
  );
}
