"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, type User } from "../lib/api";

type AuthState = {
  user: User | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null, loading: true,
  signin: async () => {}, signup: async () => {}, signout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signin = useCallback(async (email: string, password: string) => {
    await api.auth.signin(email, password);
    const me = await api.auth.me();
    setUser(me.data);
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    await api.auth.signup(email, password);
    const me = await api.auth.me().catch(() => null);
    // auto-signin after signup
    await api.auth.signin(email, password);
    const me2 = await api.auth.me();
    setUser(me2.data);
    void me;
  }, []);

  const signout = useCallback(async () => {
    await api.auth.signout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, signout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
