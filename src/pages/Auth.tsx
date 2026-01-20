import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { PhoneAuth } from '@/components/auth/PhoneAuth';
import { GoogleAuth } from '@/components/auth/GoogleAuth';
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="card-elevated p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Welcome
            </h1>
            <p className="text-muted-foreground">
              Sign in to continue ordering delicious food
            </p>
          </div>

          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'email' | 'phone')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail size={16} />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone size={16} />
                Phone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <EmailAuth onSuccess={handleSuccess} />
            </TabsContent>

            <TabsContent value="phone">
              <PhoneAuth onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <GoogleAuth />
        </div>
      </div>
    </div>
  );
}
