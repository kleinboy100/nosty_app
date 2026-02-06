import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { GoogleAuth } from '@/components/auth/GoogleAuth';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingRole, setCheckingRole] = useState(false);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user || checkingRole) return;
      
      setCheckingRole(true);
      
      try {
        // Check if user is a restaurant owner
        const { data, error } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        if (error) {
          console.error('Error checking ownership:', error);
          navigate('/');
        } else if (data && data.length > 0) {
          // User is a restaurant owner - redirect to dashboard
          navigate('/restaurant/dashboard', { replace: true });
        } else {
          // User is a customer - redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking ownership:', error);
        navigate('/');
      }
    };

    if (user && !authLoading) {
      checkAndRedirect();
    }
  }, [user, authLoading, navigate, checkingRole]);

  const handleSuccess = () => {
    // Navigation will be handled by the useEffect above once user state updates
  };

  // Show loading while checking auth or role
  if (authLoading || checkingRole) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is already logged in, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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

          <EmailAuth onSuccess={handleSuccess} />

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
