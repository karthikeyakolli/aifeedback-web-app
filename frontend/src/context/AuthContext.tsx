import { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAsDemoUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In Phase 1 shell, auto-load demo profile for frictionless exploration
    api.getCurrentUser()
      .then((u) => setUser(u))
      .catch((err) => console.error('Failed to load user:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const loginAsDemoUser = () => {
    setIsLoading(true);
    api.getCurrentUser()
      .then((u) => setUser(u))
      .finally(() => setIsLoading(false));
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
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
