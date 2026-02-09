import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import {
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
  registerMember as apiRegisterMember
} from '../api/endpoints';
import { setAuthToken } from '../api/client';
import type { LoginResponse } from '../api/types';

export type AuthUser = LoginResponse['user'];
type RegisterPayload = {
  email: string;
  fullName: string;
  password: string;
  phone?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'fg_token';
const USER_KEY = 'fg_user';

const storeSession = async (token: string, user: AuthUser) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

const clearSession = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const available = await SecureStore.isAvailableAsync();
        if (!available) {
          setIsReady(true);
          return;
        }
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as AuthUser;
          setToken(storedToken);
          setUser(parsedUser);
          setAuthToken(storedToken);
        }
      } catch {
        await clearSession();
      } finally {
        setIsReady(true);
      }
    };

    restore();
  }, []);

  const loginWithPassword = async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    setToken(response.token);
    setUser(response.user);
    setAuthToken(response.token);
    await storeSession(response.token, response.user);
  };

  const register = async (payload: RegisterPayload) => {
    await apiRegisterMember(payload);
    const response = await apiLogin(payload.email, payload.password);
    setToken(response.token);
    setUser(response.user);
    setAuthToken(response.token);
    await storeSession(response.token, response.user);
  };

  const loginWithGoogle = async (credential: string) => {
    const response = await apiLoginWithGoogle(credential);
    setToken(response.token);
    setUser(response.user);
    setAuthToken(response.token);
    await storeSession(response.token, response.user);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      setAuthToken(null);
      await clearSession();
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isReady,
      loginWithPassword,
      register,
      loginWithGoogle,
      logout
    }),
    [user, token, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
