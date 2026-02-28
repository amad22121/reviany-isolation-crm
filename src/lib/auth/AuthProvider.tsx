import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  type AuthUser,
  type AuthSession,
  signIn as authSignIn,
  signOut as authSignOut,
  onAuthStateChange,
} from "./authClient";

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener BEFORE checking stored session
    const unsubscribe = onAuthStateChange((sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const result = await authSignIn(email, password);
    if (result.error) return { error: result.error };
    setSession(result.session);
    setUser(result.user);
    return { error: null };
  }, []);

  const handleSignOut = useCallback(async () => {
    await authSignOut();
    setSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn: handleSignIn, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within <AuthProvider>");
  return ctx;
}
