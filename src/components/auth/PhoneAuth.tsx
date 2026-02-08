import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface PhoneAuthProps {
  onSuccess: () => void;
}

export function PhoneAuth({ onSuccess }: PhoneAuthProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const { toast } = useToast();

  const formatPhoneNumber = (input: string) => {
    // Remove non-digits
    const digits = input.replace(/\D/g, '');
    
    // If starts with 0, assume South African number
    if (digits.startsWith('0')) {
      return '+27' + digits.slice(1);
    }
    // If already has country code
    if (digits.startsWith('27')) {
      return '+' + digits;
    }
    // Default: assume it needs +27
    if (!input.startsWith('+')) {
      return '+27' + digits;
    }
    return input;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
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
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      
      if (error) {
        toast({
          title: "Error sending OTP",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setOtpSent(true);
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
      
      const { error } = await supabase.auth.verifyOtp({
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

  if (otpSent) {
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
            onClick={() => {
              setOtpSent(false);
              setOtp('');
            }}
            className="text-sm text-primary hover:underline font-medium"
          >
            Use a different number
          </button>
          <div>
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Didn't receive code? Resend
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOTP} className="space-y-6">
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
          We'll send you a verification code via SMS
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
            Sending code...
          </>
        ) : (
          <>
            Send Verification Code
            <ArrowRight className="ml-2" size={18} />
          </>
        )}
      </Button>
    </form>
  );
}
