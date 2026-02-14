import { useState } from "react";
import { useAuth } from "@/store/crm-store";
import { SALES_REPS } from "@/data/crm-data";
import { Building2, Lock, User } from "lucide-react";

const LoginPage = () => {
  const { isLoggedIn, login, setRole, role } = useAuth();
  const [email, setEmail] = useState("demo@growthsales.ca");
  const [password, setPassword] = useState("demo1234");

  if (isLoggedIn && !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="glass-card p-8 w-full max-w-md glow-green">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Growth Sales CRM</h1>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-6 text-center">Select Your Role</h2>
          <div className="space-y-3">
            <button
              onClick={() => setRole("manager")}
              className="w-full p-4 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-left transition-colors"
            >
              <div className="font-medium">Manager</div>
              <div className="text-sm text-muted-foreground">Full dashboard, leaderboard & team view</div>
            </button>
            {SALES_REPS.map((rep) => (
              <button
                key={rep.id}
                onClick={() => setRole("sales_rep", rep.id)}
                className="w-full p-4 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-left transition-colors"
              >
                <div className="font-medium">Sales Rep — {rep.name}</div>
                <div className="text-sm text-muted-foreground">Personal appointments & goals</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="glass-card p-8 w-full max-w-sm glow-green">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Growth Sales CRM</h1>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <button
            onClick={login}
            className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
          <p className="text-xs text-muted-foreground text-center">Demo credentials pre-filled</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
