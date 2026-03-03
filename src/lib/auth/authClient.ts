/**
 * Auth client — wraps Supabase auth calls.
 */

import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  access_token: string;
  user: AuthUser;
}

function toAuthUser(u: User): AuthUser {
  return { id: u.id, email: u.email ?? "" };
}

function toAuthSession(s: Session): AuthSession {
  return {
    access_token: s.access_token,
    user: toAuthUser(s.user),
  };
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; session: AuthSession | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, session: null, error: error.message };
  return {
    user: toAuthUser(data.user),
    session: toAuthSession(data.session),
    error: null,
  };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error: error?.message ?? null };
}

export function onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
  // Check current session first
  supabase.auth.getSession().then(({ data: { session } }) => {
    callback(session ? toAuthSession(session) : null);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ? toAuthSession(session) : null);
  });

  return () => subscription.unsubscribe();
}

export function getStoredSession(): AuthSession | null {
  // Supabase handles session persistence internally
  return null;
}
