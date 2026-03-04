import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { UserRole } from '../models';

type AuthState = {
  token: string | null;
  role: UserRole | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (role: UserRole, token?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = 'auth_token';
const ROLE_KEY = 'auth_role';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ token: null, role: null, loading: true });

  useEffect(() => {
    const hydrate = async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const role = (await SecureStore.getItemAsync(ROLE_KEY)) as UserRole | null;
      setState({ token, role, loading: false });
    };
    hydrate();
  }, []);

  const login = useCallback(async (role: UserRole, token = `secure-token-${role}`) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(ROLE_KEY, role);
    setState({ token, role, loading: false });
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(ROLE_KEY);
    setState({ token: null, role: null, loading: false });
  }, []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};