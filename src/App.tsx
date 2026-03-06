import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/lib/auth/AuthProvider";
import { WorkspaceProvider, useWorkspaceContext } from "@/lib/workspace/WorkspaceProvider";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AddAppointmentPage from "./pages/AddAppointmentPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import RepViewPage from "./pages/RepViewPage";
import UserManagementPage from "./pages/UserManagementPage";
import HotCallsPage from "./pages/HotCallsPage";
import CalendarPage from "./pages/CalendarPage";
import StatisticsPage from "./pages/StatisticsPage";
import TerritoiresPage from "./pages/TerritoiresPage";
import CarteTerritoiresPage from "./pages/CarteTerritoiresPage";
import MarketingLeadsPage from "./pages/MarketingLeadsPage";
import BacklogPage from "./pages/BacklogPage";
import AppLayout from "./components/AppLayout";
import QuickClientSearch from "./components/QuickClientSearch";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}<QuickClientSearch /></AppLayout>
  </ProtectedRoute>
);

const LoginRoute = () => {
  const { user, loading } = useAuthContext();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
};

const HomeRedirect = () => {
  const { role } = useWorkspaceContext();
  if (role === "representant") return <Navigate to="/rep" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />
      <Route path="/dashboard" element={<AuthenticatedLayout><DashboardPage /></AuthenticatedLayout>} />
      <Route path="/add-appointment" element={<AuthenticatedLayout><AddAppointmentPage /></AuthenticatedLayout>} />
      <Route path="/leaderboard" element={<AuthenticatedLayout><LeaderboardPage /></AuthenticatedLayout>} />
      <Route path="/appointments" element={<AuthenticatedLayout><AppointmentsPage /></AuthenticatedLayout>} />
      <Route path="/rep" element={<AuthenticatedLayout><RepViewPage /></AuthenticatedLayout>} />
      <Route path="/hot-calls" element={<AuthenticatedLayout><HotCallsPage /></AuthenticatedLayout>} />
      <Route path="/calendar" element={<AuthenticatedLayout><CalendarPage /></AuthenticatedLayout>} />
      <Route path="/statistics" element={<AuthenticatedLayout><StatisticsPage /></AuthenticatedLayout>} />
      <Route path="/backlog" element={<AuthenticatedLayout><BacklogPage /></AuthenticatedLayout>} />
      <Route path="/route-du-jour" element={<Navigate to="/calendar" replace />} />
      <Route path="/territoires" element={<AuthenticatedLayout><TerritoiresPage /></AuthenticatedLayout>} />
      <Route path="/carte-territoires" element={<AuthenticatedLayout><CarteTerritoiresPage /></AuthenticatedLayout>} />
      <Route path="/marketing-leads" element={<AuthenticatedLayout><MarketingLeadsPage /></AuthenticatedLayout>} />
      <Route path="/users" element={<AuthenticatedLayout><UserManagementPage /></AuthenticatedLayout>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </WorkspaceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
