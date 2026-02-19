import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS } from "@/data/crm-data";
import { Trophy, Medal } from "lucide-react";

const LeaderboardPage = () => {
  const { appointments, dailyTarget } = useCrm();
  const { role, currentManagerId } = useAuth();
  const [tab, setTab] = useState<"daily" | "weekly" | "monthly" | "alltime">("daily");

  const today = new Date().toISOString().split("T")[0];

  const teamReps = useMemo(() => {
    if (role === "gestionnaire" && currentManagerId) {
      return SALES_REPS.filter((r) => r.managerId === currentManagerId);
    }
    return SALES_REPS;
  }, [role, currentManagerId]);

  const DAILY_GOAL = Math.ceil(dailyTarget / SALES_REPS.length);

  const data = useMemo(() => {
    const now = new Date();
    const filtered = appointments.filter((a) => {
      const d = new Date(a.date);
      if (tab === "daily") return a.date === today;
      if (tab === "weekly") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return d >= weekStart;
      }
      if (tab === "monthly") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true; // alltime
    });

    return teamReps.map((rep) => {
      const repAppts = filtered.filter((a) => a.repId === rep.id);
      const confirmed = repAppts.filter((a) => a.status === "Confirmé" || a.status === "Closed").length;
      return {
        ...rep,
        booked: repAppts.length,
        confirmed,
        rate: repAppts.length > 0 ? Math.round((confirmed / repAppts.length) * 100) : 0,
      };
    }).sort((a, b) => b.booked - a.booked);
  }, [appointments, tab, today, teamReps]);

  const goalMultiplier = tab === "daily" ? 1 : tab === "weekly" ? 5 : tab === "monthly" ? 22 : 260;

  const tabLabels = { daily: "Jour", weekly: "Semaine", monthly: "Mois", alltime: "Tout" };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-foreground">Classement</h1>
        {role === "gestionnaire" && (
          <span className="text-xs bg-info/20 text-info px-2 py-1 rounded-full">Mon équipe</span>
        )}
        <div className="flex gap-1 ml-auto">
          {(["daily", "weekly", "monthly", "alltime"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {tabLabels[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Rang", "Représentant", "Réservés", "Confirmés", "Taux", "Progression objectif"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((rep, i) => (
              <tr key={rep.id} className={`border-b border-border/50 ${i === 0 ? "bg-primary/5" : ""}`}>
                <td className="px-4 py-3">
                  {i === 0 ? (
                    <Trophy className="h-5 w-5 text-warning" />
                  ) : i === 1 ? (
                    <Medal className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <span className="text-muted-foreground">{i + 1}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{rep.name}</td>
                <td className="px-4 py-3 text-foreground">{rep.booked}</td>
                <td className="px-4 py-3 text-primary">{rep.confirmed}</td>
                <td className="px-4 py-3 text-foreground">{rep.rate}%</td>
                <td className="px-4 py-3 w-48">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, (rep.booked / (DAILY_GOAL * goalMultiplier)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{rep.booked}/{DAILY_GOAL * goalMultiplier}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardPage;
