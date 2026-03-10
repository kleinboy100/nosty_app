import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { lovable } from '@/integrations/lovable/index';
import { useToast } from '@/hooks/use-toast';

export function GoogleAuth() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // ✅ Safely get VITE_APP_URL — fallback to window.origin if missing
      const appUrl = import.meta.env.VITE_APP_URL?.trim();
      const redirectUri =
        appUrl && appUrl !== 'undefined' && appUrl.startsWith('http')
          ? appUrl.replace(/\/+$/, '') + '/'
          : window.location.origin.replace(/\/+$/, '') + '/';

      // ✅ CORRECT PROVIDER NAME: 'google' — NOT '2google'
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: redirectUri,
        extraParams: { prompt: 'select_account' },
      });

      if (error) throw error;
    } catch (err: any) {
      const message =
        err?.message || 'Google sign-in failed. Please try again.';
      toast({
        title: 'Sign-in Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-12 flex items-center justify-center gap-2"
      onClick={handleGoogleSignIn}
      disabled={loading}
    >
      {loading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          <span>Signing in…</span>
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-2.03 2.16-4.92 2.16-1.88 0-3.54-.73-4.81-2.2l-3.83 3.83c2.33 1.43 5.48 2.2 9.1 2.2 6.99 0 13.02-5.72 13.02-13.02v-.8z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-5.57-4.33c-.98.72-2.23 1.15-3.71 1.15-2.86 0-5.29-1.93-6.16-4.53H.83v2.84C2.68 18.77 7.04 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H0C0 8.07 0 9.07 0 10.07s0 2.00 0 3.00v.93z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.89c1.64 0 3.06.56 4.23 1.67l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.83 3.44 1.5 7.07l3.66 2.84c.86-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </>
      )}
    </Button>
  );
}
