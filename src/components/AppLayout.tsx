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
} from "lucide-react";
import { useState } from "react";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, logout, currentRepId } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const managerLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/add-appointment", label: "Add Appointment", icon: CalendarPlus },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: "/appointments", label: "Appointments", icon: List },
  ];

  const repLinks = [
    { to: "/rep", label: "My View", icon: User },
    { to: "/add-appointment", label: "Add Appointment", icon: CalendarPlus },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: "/appointments", label: "Appointments", icon: List },
  ];

  const links = role === "manager" ? managerLinks : repLinks;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
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
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 gap-4 bg-card/50 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h2 className="text-sm font-medium text-foreground capitalize">
            {location.pathname.replace(/^\//, "").replace(/-/g, " ") || "Dashboard"}
          </h2>
          <div className="ml-auto text-xs text-muted-foreground">
            {role === "manager" ? "Manager View" : "Sales Rep View"}
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
