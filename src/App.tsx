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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, role } = useAuth();
  if (!isLoggedIn || !role) return <Navigate to="/" replace />;
  return <AppLayout>{children}<QuickClientSearch /></AppLayout>;
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
      <Route path="/hot-calls" element={<AuthGuard><HotCallsPage /></AuthGuard>} />
      <Route path="/calendar" element={<AuthGuard><CalendarPage /></AuthGuard>} />
      <Route path="/statistics" element={<AuthGuard><StatisticsPage /></AuthGuard>} />

      <Route path="/backlog" element={<AuthGuard><BacklogPage /></AuthGuard>} />
      <Route path="/route-du-jour" element={<Navigate to="/calendar" replace />} />
      <Route path="/territoires" element={<AuthGuard><TerritoiresPage /></AuthGuard>} />
      <Route path="/carte-territoires" element={<AuthGuard><CarteTerritoiresPage /></AuthGuard>} />
      <Route path="/marketing-leads" element={<AuthGuard><MarketingLeadsPage /></AuthGuard>} />
      <Route path="/users" element={<AuthGuard><UserManagementPage /></AuthGuard>} />
      
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
