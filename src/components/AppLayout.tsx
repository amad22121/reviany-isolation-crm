import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/store/crm-store";
import {
  LayoutDashboard,
  CalendarPlus,
  Trophy,
  List,
  User,
  LogOut,
  Building2,
  Menu,
  X,
  
  Crown,
  Users,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  "add-appointment": "Nouveau rendez-vous",
  leaderboard: "Classement",
  appointments: "Rendez-vous",
  rep: "Ma vue",
  
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const ownerLinks = [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/add-appointment", label: "Nouveau rendez-vous", icon: CalendarPlus },
    { to: "/leaderboard", label: "Classement", icon: Trophy },
    { to: "/appointments", label: "Rendez-vous", icon: List },
  ];

  const managerLinks = [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/add-appointment", label: "Nouveau rendez-vous", icon: CalendarPlus },
    { to: "/leaderboard", label: "Classement", icon: Trophy },
    { to: "/appointments", label: "Rendez-vous", icon: List },
  ];

  const repLinks = [
    { to: "/rep", label: "Ma vue", icon: User },
    { to: "/add-appointment", label: "Nouveau rendez-vous", icon: CalendarPlus },
    { to: "/leaderboard", label: "Classement", icon: Trophy },
    { to: "/appointments", label: "Rendez-vous", icon: List },
  ];

  const links = role === "proprietaire" ? ownerLinks : role === "gestionnaire" ? managerLinks : repLinks;

  const roleIcon = role === "proprietaire" ? Crown : role === "gestionnaire" ? Users : UserCheck;
  const roleLabel = role === "proprietaire" ? "Propriétaire" : role === "gestionnaire" ? "Gestionnaire" : "Représentant";
  const RoleIcon = roleIcon;

  const routeKey = location.pathname.replace(/^\//, "");
  const pageTitle = ROUTE_LABELS[routeKey] || routeKey.replace(/-/g, " ") || "Tableau de bord";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={`${
          sidebarOpen ? "w-60" : "w-0 overflow-hidden"
        } bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 shrink-0`}
      >
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-sm whitespace-nowrap">Growth Sales CRM</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`
              }
            >
              <link.icon className="h-4 w-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 gap-4 bg-card/50 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h2 className="text-sm font-medium text-foreground capitalize">{pageTitle}</h2>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <RoleIcon className="h-3.5 w-3.5" />
            {roleLabel}
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
