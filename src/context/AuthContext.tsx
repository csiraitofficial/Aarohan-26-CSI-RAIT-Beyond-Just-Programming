import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../models';
import { fetchProfile } from '../services/api';

const AUTH_STORAGE_KEY = '@swasthya_auth';

type AuthState = {
  token: string | null;
  userId: string | null;
  role: UserRole | null;
  fullName: string | null;
  phone: string | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (role: UserRole, token: string, userId: string, fullName?: string, phone?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    role: null,
    fullName: null,
    phone: null,
    loading: true,
  });

  // Restore session from AsyncStorage on mount, validate token
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.token) {
            // Validate token by calling the backend
            try {
              const user = await fetchProfile(saved.token);
              setState({
                token: saved.token,
                userId: user.id ?? saved.userId ?? null,
                role: (user.role as UserRole) ?? saved.role ?? null,
                fullName: user.full_name ?? saved.fullName ?? null,
                phone: user.phone ?? saved.phone ?? null,
                loading: false,
              });
              return;
            } catch {
              // Token is invalid/expired — clear stored session
              await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            }
          }
        }
      } catch {}
      setState((s) => ({ ...s, loading: false }));
    })();
  }, []);

  const login = useCallback((role: UserRole, token: string, userId: string, fullName?: string, phone?: string) => {
    const next: AuthState = { token, userId, role, fullName: fullName ?? null, phone: phone ?? null, loading: false };
    setState(next);
    AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const logout = useCallback(() => {
    const next: AuthState = { token: null, userId: null, role: null, fullName: null, phone: null, loading: false };
    setState(next);
    AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};