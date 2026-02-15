import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/store/crm-store";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AddAppointmentPage from "./pages/AddAppointmentPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import RepViewPage from "./pages/RepViewPage";
import ZonesPage from "./pages/ZonesPage";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, role } = useAuth();
  if (!isLoggedIn || !role) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const AppRoutes = () => {
  const { isLoggedIn, role } = useAuth();

  const getDefaultRoute = () => {
    if (role === "representant") return "/rep";
    return "/dashboard";
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoggedIn && role ? (
            <Navigate to={getDefaultRoute()} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
      <Route path="/add-appointment" element={<AuthGuard><AddAppointmentPage /></AuthGuard>} />
      <Route path="/leaderboard" element={<AuthGuard><LeaderboardPage /></AuthGuard>} />
      <Route path="/appointments" element={<AuthGuard><AppointmentsPage /></AuthGuard>} />
      <Route path="/rep" element={<AuthGuard><RepViewPage /></AuthGuard>} />
      <Route path="/zones" element={<AuthGuard><ZonesPage /></AuthGuard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
