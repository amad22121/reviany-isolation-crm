// TODO: Replace with Supabase
// This file wraps authentication calls. Replace the placeholder implementations
// with real Supabase auth calls when ready.

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  access_token: string;
  user: AuthUser;
}

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

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

/**
 * TODO: Replace with Supabase
 * Sign in with email and password.
 * Currently returns a fake session after a short delay to simulate network.
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  // TODO: Replace with Supabase
  // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  await new Promise((r) => setTimeout(r, 800));

  if (!email || !password) {
    return { user: null, session: null, error: "Email et mot de passe requis." };
  }

  if (password.length < 6) {
    return { user: null, session: null, error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  // Placeholder: accept any valid-looking email + password ≥ 6 chars
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
}

/**
 * TODO: Replace with Supabase
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  // TODO: Replace with Supabase
  // await supabase.auth.signOut();
  saveSession(null);
}

/**
 * TODO: Replace with Supabase
 * Send a password reset email.
 */
export async function resetPassword(email: string): Promise<{ error: string | null }> {
  // TODO: Replace with Supabase
  // const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: ... });
  await new Promise((r) => setTimeout(r, 500));
  if (!email) return { error: "Email requis." };
  return { error: null };
}

/**
 * TODO: Replace with Supabase
 * Listen for auth state changes.
 * Currently just checks localStorage on init.
 */
export function onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
  // TODO: Replace with Supabase
  // const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { ... });
  // return () => subscription.unsubscribe();

  // For now, just fire once with stored session
  const session = getStoredSession();
  setTimeout(() => callback(session), 0);

  // Listen for storage changes (multi-tab support)
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(e.newValue ? JSON.parse(e.newValue) : null);
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
