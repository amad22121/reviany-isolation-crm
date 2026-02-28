// Backward-compatible hook that bridges old useAuth interface to new auth/workspace system.
// All existing pages can keep importing { useAuth } from "@/store/crm-store".

import { useAuthContext } from "@/lib/auth/AuthProvider";
import { useWorkspaceContext, type AppRole } from "@/lib/workspace/WorkspaceProvider";

interface LegacyAuthState {
  isLoggedIn: boolean;
  role: AppRole | null;
  currentRepId: string | null;
  currentManagerId: string | null;
  logout: () => void;
}

export function useAuthCompat(): LegacyAuthState {
  const { user, signOut } = useAuthContext();
  const { role, currentRepId, currentManagerId } = useWorkspaceContext();

  return {
    isLoggedIn: !!user,
    role,
    currentRepId,
    currentManagerId,
    logout: signOut,
  };
}

