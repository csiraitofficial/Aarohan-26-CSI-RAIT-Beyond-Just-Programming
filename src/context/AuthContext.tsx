import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { UserRole } from '../models';

type AuthState = {
  token: string | null;
  userId: string | null;
  role: UserRole | null;
  fullName: string | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (role: UserRole, token: string, userId: string, fullName?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    role: null,
    fullName: null,
    loading: false,
  });

  const login = useCallback((role: UserRole, token: string, userId: string, fullName?: string) => {
    setState({ token, userId, role, fullName: fullName ?? null, loading: false });
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, userId: null, role: null, fullName: null, loading: false });
  }, []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};