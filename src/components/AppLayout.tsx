import { NavLink, useLocation } from "react-router-dom";
import { useWorkspaceContext } from "@/lib/workspace/WorkspaceProvider";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { SALES_REPS, MANAGERS } from "@/data/crm-data";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  Trophy,
  List,
  User,
  LogOut,
  Building2,
  Menu,
  X,
  Flame,
  Crown,
  Users,
  UserCheck,
  Archive,
  MapPinned,
  Megaphone,
  BarChart3,
  Settings,
} from "lucide-react";
import { useState } from "react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  "add-appointment": "Nouveau rendez-vous",
  leaderboard: "Classement",
  appointments: "Rendez-vous",
  rep: "Ma vue",
  users: "Gestion utilisateurs",
  "hot-calls": "Hot Calls",
  calendar: "Calendrier",
  territoires: "Territoires",
  backlog: "Backlog",
  "marketing-leads": "Marketing Leads",
  statistics: "Statistiques",
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, setDevRole, currentRepId, currentManagerId } = useWorkspaceContext();
  const { signOut } = useAuthContext();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDevPanel, setShowDevPanel] = useState(false);

  const ownerLinks = [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/calendar", label: "Calendrier", icon: CalendarDays },
    { to: "/territoires", label: "Territoires", icon: MapPinned },
    { to: "/add-appointment", label: "Nouveau rendez-vous", icon: CalendarPlus },
    { to: "/hot-calls", label: "Hot Calls", icon: Flame },
    { to: "/marketing-leads", label: "Marketing Leads", icon: Megaphone },
    { to: "/backlog", label: "Backlog", icon: Archive },
    { to: "/leaderboard", label: "Classement", icon: Trophy },
    { to: "/appointments", label: "Rendez-vous", icon: List },
    { to: "/statistics", label: "Statistiques", icon: BarChart3 },
    { to: "/users", label: "Gestion utilisateurs", icon: Users },
  ];

  const managerLinks = [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/calendar", label: "Calendrier", icon: CalendarDays },
    { to: "/territoires", label: "Territoires", icon: MapPinned },
    { to: "/add-appointment", label: "Nouveau rendez-vous", icon: CalendarPlus },
    { to: "/hot-calls", label: "Hot Calls", icon: Flame },
    { to: "/marketing-leads", label: "Marketing Leads", icon: Megaphone },
    { to: "/backlog", label: "Backlog", icon: Archive },
    { to: "/leaderboard", label: "Classement", icon: Trophy },
    { to: "/appointments", label: "Rendez-vous", icon: List },
    { to: "/statistics", label: "Statistiques", icon: BarChart3 },
  ];

  const repLinks = [
    { to: "/rep", label: "Ma vue", icon: User },
    { to: "/calendar", label: "Calendrier", icon: CalendarDays },
    { to: "/territoires", label: "Territoires", icon: MapPinned },
    { to: "/add-appointment", label: "Nouveau rendez-vous", icon: CalendarPlus },
    { to: "/hot-calls", label: "Hot Calls", icon: Flame },
    { to: "/marketing-leads", label: "Marketing Leads", icon: Megaphone },
    { to: "/backlog", label: "Backlog", icon: Archive },
    { to: "/leaderboard", label: "Classement", icon: Trophy },
    { to: "/appointments", label: "Rendez-vous", icon: List },
    { to: "/statistics", label: "Statistiques", icon: BarChart3 },
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
        } bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0 transition-all duration-200 shrink-0 overflow-hidden`}
      >
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-sm whitespace-nowrap">Growth Sales CRM</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
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
        <div className="p-3 border-t border-sidebar-border space-y-1 shrink-0">
          <button
            onClick={() => setShowDevPanel(!showDevPanel)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Dev: Changer rôle</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground">
            <RoleIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{roleLabel}</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Se déconnecter</span>
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
            <span className="hidden sm:inline">{roleLabel}</span>
          </div>
        </header>

        {/* Dev role panel */}
        {showDevPanel && (
          <div className="border-b border-border bg-card/80 p-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">🔧 Dev: Changer de rôle (placeholder)</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDevRole("proprietaire")}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  role === "proprietaire" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Crown className="h-3 w-3 inline mr-1" /> Propriétaire
              </button>
              {MANAGERS.map((mgr) => (
                <button
                  key={mgr.id}
                  onClick={() => setDevRole("gestionnaire", null, mgr.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    role === "gestionnaire" && currentManagerId === mgr.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Users className="h-3 w-3 inline mr-1" /> Gestionnaire — {mgr.name}
                </button>
              ))}
              {SALES_REPS.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setDevRole("representant", rep.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    role === "representant" && currentRepId === rep.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  <UserCheck className="h-3 w-3 inline mr-1" /> {rep.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
