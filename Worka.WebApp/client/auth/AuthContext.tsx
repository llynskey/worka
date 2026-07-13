import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { TOKEN_KEY } from '../api/workaApi';

export type Role = 'customer' | 'professional';

export type User = {
  sub?: string;
  Type?: string;
  AccountType?: string;
  Username?: string;
  email?: string;
  exp?: number;
  role?: Role;
  userId?: string;
  [key: string]: any;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  role: Role | null;
  userId: string | null;
  loading: boolean;
  signInWithToken: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshFromStorage: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  role: null,
  userId: null,
  loading: true,
  signInWithToken: async () => {},
  signOut: async () => {},
  refreshFromStorage: async () => {},
});

const nameIdentifierClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

function normalizeRole(value: unknown): Role | null {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'customer' || raw === '0') {
    return 'customer';
  }

  if (raw === 'professional' || raw === 'worker' || raw === '1') {
    return 'professional';
  }

  return null;
}

function normalizeUser(decoded: User): User {
  const role = normalizeRole(decoded.Type ?? decoded.AccountType);
  return {
    ...decoded,
    role: role ?? undefined,
    userId: decoded.sub ?? decoded[nameIdentifierClaim] ?? undefined,
  };
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const decodeAndSet = useCallback(
    async (nextToken: string) => {
      try {
        const decoded = normalizeUser(jwtDecode<User>(nextToken));
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          await clearAuth();
          return;
        }

        setToken(nextToken);
        setUser(decoded);
      } catch (error) {
        console.warn('Invalid token, clearing stored auth.', error);
        await clearAuth();
      }
    },
    [clearAuth]
  );

  const signInWithToken = useCallback(
    async (nextToken: string) => {
      await AsyncStorage.setItem(TOKEN_KEY, nextToken);
      await decodeAndSet(nextToken);
    },
    [decodeAndSet]
  );

  const signOut = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  const refreshFromStorage = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        await decodeAndSet(storedToken);
      } else {
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [decodeAndSet]);

  useEffect(() => {
    refreshFromStorage();
  }, [refreshFromStorage]);

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role ?? null,
      userId: user?.userId ?? null,
      loading,
      signInWithToken,
      signOut,
      refreshFromStorage,
    }),
    [user, token, loading, signInWithToken, signOut, refreshFromStorage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
