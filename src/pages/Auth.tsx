import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { GoogleAuth } from '@/components/auth/GoogleAuth';
import { PhoneAuth } from '@/components/auth/PhoneAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Phone } from 'lucide-react';

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-3xl">🍔</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to continue ordering delicious food
            </p>
          </div>

          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'email' | 'phone')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail size={16} />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone size={16} />
                Phone
              </TabsTrigger>
            </TabsList>
            <TabsContent value="email" className="mt-6">
              <EmailAuth onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="phone" className="mt-6">
              <PhoneAuth onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">Or continue with</span>
            </div>
          </div>

          <GoogleAuth />
        </div>
      </div>
    </div>
  );
}
