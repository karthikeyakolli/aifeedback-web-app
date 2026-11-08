import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authProvider: 'supabase' | 'local';
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle?: () => Promise<void>;
  loginWithGitHub?: () => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    bio?: string;
  }) => Promise<void>;
  quickLoginDev?: (accountType: 'creator' | 'visitor' | 'moderator') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const authProvider: 'supabase' | 'local' = isSupabaseConfigured() ? 'supabase' : 'local';

  const openAuthModal = useCallback((mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Restore authenticated session from persistent token or Supabase session on load
  useEffect(() => {
    // 1. Check local persistent token
    const localToken = getStoredToken();
    if (localToken) {
      api.getCurrentUser()
        .then((u) => {
          setUser(u);
          setIsLoading(false);
        })
        .catch(() => {
          clearStoredToken();
          setUser(null);
          setIsLoading(false);
        });
    } else if (isSupabaseConfigured() && supabase) {
      // 2. If no local token, check Supabase session if configured
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setStoredToken(session.access_token);
          api.getCurrentUser()
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
        } else {
          setIsLoading(false);
        }
      }).catch(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    // 3. Supabase Auth state change listener (Handles auto-refresh, token rotation, and multi-tab signout)
    let authSubscription: any = null;
    if (isSupabaseConfigured() && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          if (session?.access_token) {
            setStoredToken(session.access_token);
            try {
              const u = await api.getCurrentUser();
              setUser(u);
            } catch {
              // ignore
            }
          }
        } else if (event === 'SIGNED_OUT') {
          clearStoredToken();
          setUser(null);
        }
      });
      authSubscription = data?.subscription;
    }

    return () => {
      authSubscription?.unsubscribe?.();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // 1. Primary: Direct API authentication against database (instant, reliable, 100% free)
      try {
        const res = await api.login({ email, password });
        setUser(res.user);
        closeAuthModal();
        return;
      } catch (localErr: any) {
        // 2. Fallback to Supabase if configured and local user not found
        if (isSupabaseConfigured() && supabase) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (!error && data.session) {
              setStoredToken(data.session.access_token);
              const u = await api.getCurrentUser();
              setUser(u);
              closeAuthModal();
              return;
            }
          } catch {
            // ignore and bubble original error
          }
        }
        throw localErr;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } else {
      throw new Error('Google OAuth is not configured on this environment.');
    }
  };

  const loginWithGitHub = async (): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } else {
      throw new Error('GitHub OAuth is not configured on this environment.');
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    bio?: string;
  }): Promise<void> => {
    setIsLoading(true);
    try {
      // 1. Direct registration against database (creates profile, hashes password, returns JWT immediately)
      const res = await api.signup(data);
      setUser(res.user);
      closeAuthModal();
    } catch (err: any) {
      // 2. Check if Supabase fallback is viable
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: {
                username: data.username,
                display_name: data.displayName,
              },
            },
          });
          if (!error && authData.session) {
            setStoredToken(authData.session.access_token);
            const u = await api.getCurrentUser();
            setUser(u);
            closeAuthModal();
            return;
          } else if (!error && authData.user && !authData.session) {
            throw new Error(
              'Account created! A confirmation email was dispatched. Please verify your inbox, then sign in.'
            );
          }
        } catch (sbErr: any) {
          if (sbErr.message && !sbErr.message.includes('fetch')) {
            throw sbErr;
          }
        }
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginDev = async (accountType: 'creator' | 'visitor' | 'moderator' = 'creator'): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await api.getDevQuickToken(accountType);
      setStoredToken(data.access_token);
      const u = await api.getCurrentUser();
      setUser(u);
      closeAuthModal();
    } catch (e: any) {
      console.error('Dev quick login failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut();
      } else {
        await api.logout();
      }
      clearStoredToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authProvider,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        loginWithGoogle,
        loginWithGitHub,
        signup,
        quickLoginDev,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
