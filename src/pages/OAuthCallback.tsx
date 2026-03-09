import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function OAuthCallback() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Once the auth session is established, redirect home
    if (user) {
      navigate('/', { replace: true });
    }
    // Give the auth library time to process the callback
    const timeout = setTimeout(() => {
      navigate('/', { replace: true });
    }, 5000);
    return () => clearTimeout(timeout);
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
