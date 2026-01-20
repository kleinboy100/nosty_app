import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, ArrowRight } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface PhoneAuthProps {
  onSuccess: () => void;
}

export function PhoneAuth({ onSuccess }: PhoneAuthProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        toast({
          title: "Error sending code",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Code sent!",
          description: "Check your phone for the verification code."
        });
        setStep('otp');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      
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

  if (step === 'otp') {
    return (
      <form onSubmit={verifyOtp} className="space-y-6">
        <div className="space-y-2">
          <Label>Enter verification code</Label>
          <p className="text-sm text-muted-foreground mb-4">
            We sent a 6-digit code to {phone}
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
              Verify Code
              <ArrowRight className="ml-2" size={18} />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={() => {
            setStep('phone');
            setOtp('');
          }}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          Use a different phone number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            id="phone"
            type="tel"
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pl-10"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Include country code (e.g., +1 for US)
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full btn-primary h-12"
        disabled={loading || !phone.trim()}
      >
        {loading ? 'Sending code...' : (
          <>
            Send Verification Code
            <ArrowRight className="ml-2" size={18} />
          </>
        )}
      </Button>
    </form>
  );
}
