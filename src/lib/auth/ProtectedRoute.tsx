import { Navigate } from "react-router-dom";
import { useAuthContext } from "./AuthProvider";
import { useWorkspaceContext } from "@/lib/workspace/WorkspaceProvider";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuthContext();
  const { loading: wsLoading } = useWorkspaceContext();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (wsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement de l'espace de travail…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
