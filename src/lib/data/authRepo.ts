/**
 * Auth Repository — wraps authentication operations.
 * TODO: Replace with Supabase Auth when connecting backend.
 *
 * Supabase shape:
 *   getSession → supabase.auth.getSession()
 *   signIn → supabase.auth.signInWithPassword({ email, password })
 *   signOut → supabase.auth.signOut()
 *   getUserProfile → supabase.from('profiles').select('*').eq('user_id', userId).single()
 *   onAuthStateChange → supabase.auth.onAuthStateChange(callback)
 */

import type { AuthUser, AuthSession, UserProfile } from "@/domain/types";

interface AuthResponse {
  user: AuthUser | null;
  session: AuthSession | null;
  error: string | null;
}

const STORAGE_KEY = "crm_auth_session";

function saveSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export const authRepo = {
  /**
   * TODO: Replace with Supabase
   * const { data: { session } } = await supabase.auth.getSession();
   */
  async getSession(): Promise<AuthSession | null> {
    return getStoredSession();
  },

  /**
   * TODO: Replace with Supabase
   * const { data, error } = await supabase.auth.signInWithPassword({ email, password });
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    await new Promise((r) => setTimeout(r, 800));
    if (!email || !password) {
      return { user: null, session: null, error: "Email et mot de passe requis." };
    }
    if (password.length < 6) {
      return { user: null, session: null, error: "Le mot de passe doit contenir au moins 6 caractères." };
    }
    const user: AuthUser = {
      id: `user_${btoa(email).slice(0, 12)}`,
      email,
    };
    const session: AuthSession = {
      access_token: `placeholder_token_${Date.now()}`,
      user,
    };
    saveSession(session);
    return { user, session, error: null };
  },

  /**
   * TODO: Replace with Supabase
   * await supabase.auth.signOut();
   */
  async signOut(): Promise<void> {
    saveSession(null);
  },

  /**
   * TODO: Replace with Supabase
   * const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    // TODO: Replace with Supabase query
    return {
      id: userId,
      user_id: userId,
      display_name: "Utilisateur",
      phone: null,
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
  },

  /**
   * TODO: Replace with Supabase
   * const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
   */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    await new Promise((r) => setTimeout(r, 500));
    if (!email) return { error: "Email requis." };
    return { error: null };
  },

  /**
   * TODO: Replace with Supabase
   * supabase.auth.onAuthStateChange((event, session) => callback(session));
   */
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    const session = getStoredSession();
    setTimeout(() => callback(session), 0);
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
