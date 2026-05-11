import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const memoryAuthStore = new Map();

function createAuthStorage() {
  if (typeof window === 'undefined') {
    return {
      getItem: (key) => memoryAuthStore.get(key) || null,
      removeItem: (key) => memoryAuthStore.delete(key),
      setItem: (key, value) => memoryAuthStore.set(key, value),
    };
  }

  return {
    getItem: (key) => {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return memoryAuthStore.get(key) || null;
      }
    },
    removeItem: (key) => {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        memoryAuthStore.delete(key);
      }
    },
    setItem: (key, value) => {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {
        memoryAuthStore.set(key, value);
      }
    },
  };
}

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: createAuthStorage(),
        storageKey: 'resos.auth.session',
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env.local and Vercel.');
  }

  return supabase;
}
