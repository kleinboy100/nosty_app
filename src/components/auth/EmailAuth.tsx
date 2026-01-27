import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, ArrowRight, RefreshCw } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
interface EmailAuthProps {
  onSuccess: () => void;
}

export function EmailAuth({ onSuccess }: EmailAuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  
  const { toast } = useToast();

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // For login, try with OTP first
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          }
        });
        
        if (error) {
          // If OTP fails (user might not exist or other error), try password
          const { error: passwordError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (passwordError) {
            toast({
              title: "Error signing in",
              description: passwordError.message,
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
          toast({
            title: "Check your email",
            description: "We sent you a 6-digit verification code."
          });
          setStep('otp');
        }
      } else {
        // For signup, send OTP for email verification
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            data: { 
              full_name: fullName,
              password_pending: password // Store temporarily
            }
          }
        });
        
        if (error) {
          toast({
            title: "Error signing up",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Verify your email",
            description: "We sent you a 6-digit verification code."
          });
          setStep('otp');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
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
        // If signup, update the user's password
        if (!isLogin && password) {
          await supabase.auth.updateUser({ password });
        }
        
        toast({
          title: isLogin ? "Welcome back!" : "Account created!",
          description: isLogin ? "You have successfully signed in." : "You can now start ordering food."
        });
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: !isLogin,
          data: !isLogin ? { full_name: fullName } : undefined
        }
      });
      
      if (error) {
        toast({
          title: "Failed to resend code",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Code sent!",
          description: "Check your email for the new verification code."
        });
        setResendCooldown(60); // 60 second cooldown
      }
    } finally {
      setResending(false);
    }
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-6">
        <div className="space-y-2">
          <Label>Enter verification code</Label>
          <p className="text-sm text-muted-foreground mb-4">
            We sent a 6-digit code to {email}
          </p>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
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
        </div>

        <Button 
          type="submit" 
          className="w-full btn-primary h-12"
          disabled={loading || otp.length !== 6}
        >
          {loading ? 'Verifying...' : (
            <>
              Verify & Continue
              <ArrowRight className="ml-2" size={18} />
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || resending}
            className="text-sm text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {resending ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend code in ${resendCooldown}s`
            ) : (
              <>
                <RefreshCw className="w-3 h-3" />
                Resend code
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setStep('credentials');
            setOtp('');
            setResendCooldown(0);
          }}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          Use a different email
        </button>
      </form>
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
        {loading ? 'Loading...' : (
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
