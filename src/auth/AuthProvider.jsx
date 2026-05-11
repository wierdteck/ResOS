import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../services/supabaseClient.js';

const AuthContext = createContext(null);
const CONFIG_ERROR = 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';

export function publicAuthError(error) {
  if (!error) return 'Authentication failed.';
  if (error.message === CONFIG_ERROR) return CONFIG_ERROR;
  if (error.status === 400 || error.status === 401 || error.status === 403) return 'Authentication failed. Check your invite, email, and password.';
  return 'Authentication could not be completed right now.';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) setAuthError(publicAuthError(error));
      setSession(data.session || null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setAuthError(null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) {
      throw new Error(CONFIG_ERROR);
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    if (!supabase) {
      throw new Error(CONFIG_ERROR);
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    if (!supabase) {
      throw new Error(CONFIG_ERROR);
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(() => ({
    authError,
    hasSupabaseConfig,
    isAuthenticated: Boolean(session),
    isLoading,
    sendPasswordReset,
    session,
    signIn,
    signOut,
    updatePassword,
    user: session?.user || null,
  }), [authError, isLoading, sendPasswordReset, session, signIn, signOut, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
