import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { mockCurrentUser } from '../fixtures/mockData';

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
  signup: (data: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    bio?: string;
  }) => Promise<void>;
  loginAsDemoUser: () => Promise<void>;
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
    if (isSupabaseConfigured() && supabase) {
      // 1. Check existing Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setStoredToken(session.access_token);
          api.getCurrentUser()
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
        } else {
          // Fallback to local stored token if available
          const localToken = getStoredToken();
          if (localToken) {
            api.getCurrentUser()
              .then(setUser)
              .catch(() => {
                clearStoredToken();
                setUser(null);
              })
              .finally(() => setIsLoading(false));
          } else {
            setIsLoading(false);
          }
        }
      });

      // 2. Listen to Supabase Auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          setStoredToken(session.access_token);
          try {
            const u = await api.getCurrentUser();
            setUser(u);
          } catch {
            setUser(null);
          }
        } else if (_event === 'SIGNED_OUT') {
          clearStoredToken();
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local dev mode session restore
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      api.getCurrentUser()
        .then((u) => setUser(u))
        .catch(() => {
          // Token expired or invalid
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.session) {
            setStoredToken(data.session.access_token);
            const u = await api.getCurrentUser();
            setUser(u);
            closeAuthModal();
            return;
          }
        } catch {
          // Fallback to local FastAPI backend auth if Supabase credentials fail
          const res = await api.login({ email, password });
          setUser(res.user);
          closeAuthModal();
          return;
        }
      } else {
        const res = await api.login({ email, password });
        setUser(res.user);
      }
      closeAuthModal();
    } finally {
      setIsLoading(false);
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
      if (isSupabaseConfigured() && supabase) {
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
        if (error) throw new Error(error.message);
        if (authData.session) {
          setStoredToken(authData.session.access_token);
          const u = await api.getCurrentUser();
          setUser(u);
        }
      } else {
        const res = await api.signup(data);
        setUser(res.user);
      }
      closeAuthModal();
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoUser = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        // Attempt Supabase login with demo credentials
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'sarah.chen@example.com',
          password: 'demo-password-123',
        });
        if (!error && data.session) {
          setStoredToken(data.session.access_token);
          const u = await api.getCurrentUser();
          setUser(u);
          closeAuthModal();
          return;
        }
      }

      // First attempt logging in with demo credentials locally
      const res = await api.login({
        email: 'sarah.chen@example.com',
        password: 'demo-password-123',
      });
      setUser(res.user);
      closeAuthModal();
    } catch {
      // If fresh database, sign up Sarah Chen
      try {
        const res = await api.signup({
          email: 'sarah.chen@example.com',
          password: 'demo-password-123',
          username: 'sarahc',
          displayName: 'Sarah Chen',
          bio: 'Building developer tools & exploring customer research workflows.',
        });
        setUser(res.user);
        closeAuthModal();
      } catch (e: any) {
        console.warn('Demo login network unavailable; using static demo profile:', e);
        setUser(mockCurrentUser);
        setStoredToken('demo_token_' + mockCurrentUser.id);
        closeAuthModal();
      }
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
        signup,
        loginAsDemoUser,
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
