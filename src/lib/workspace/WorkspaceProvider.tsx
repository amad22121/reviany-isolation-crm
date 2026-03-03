import { createContext, useContext, type ReactNode } from "react";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { useBootstrap, type Membership } from "./useBootstrap";

export type AppRole = "proprietaire" | "gestionnaire" | "representant";

interface WorkspaceContextValue {
  workspaceId: string | null;
  role: AppRole | null;
  currentRepId: string | null;
  currentManagerId: string | null;
  displayName: string | null;
  membership: Membership | null;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

import { useMemo } from "react";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const { membership, loading } = useBootstrap(user?.id ?? null);

  const value = useMemo<WorkspaceContextValue>(() => {
    return {
      workspaceId: membership?.workspace_id ?? null,
      role: membership?.role ?? null,
      currentRepId: membership?.rep_id ?? null,
      currentManagerId: membership?.manager_id ?? null,
      displayName: membership?.display_name ?? null,
      membership,
      loading,
    };
  }, [membership, loading]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used within <WorkspaceProvider>");
  return ctx;
}
