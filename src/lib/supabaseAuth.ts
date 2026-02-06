// Separate Supabase client for authentication with session storage
// This ensures each browser tab has its own independent session
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Use sessionStorage for tab-isolated sessions
// Each tab will have its own independent login state
export const supabaseAuth = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
