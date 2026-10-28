import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../types';
import { api, getStoredToken } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const openAuthModal = useCallback((mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Restore authenticated session from persistent token on load
  useEffect(() => {
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
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setUser(res.user);
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
      const res = await api.signup(data);
      setUser(res.user);
      closeAuthModal();
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoUser = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // First attempt logging in with demo credentials
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
        console.error('Demo login error:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await api.logout();
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
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        signup,
        loginAsDemoUser,
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
