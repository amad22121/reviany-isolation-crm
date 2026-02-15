import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS } from "@/data/crm-data";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Target,
  Plus,
  Bell,
  TrendingUp,
} from "lucide-react";

const DashboardPage = () => {
  const { appointments, updateStatus, dailyTarget } = useCrm();
  const { role, currentManagerId } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"today" | "week">("today");

  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  // Filter by manager's team if gestionnaire
  const teamReps = useMemo(() => {
    if (role === "gestionnaire" && currentManagerId) {
      return SALES_REPS.filter((r) => r.managerId === currentManagerId);
    }
    return SALES_REPS;
  }, [role, currentManagerId]);

  const teamRepIds = useMemo(() => new Set(teamReps.map((r) => r.id)), [teamReps]);

  const teamAppointments = useMemo(
    () => appointments.filter((a) => teamRepIds.has(a.repId)),
    [appointments, teamRepIds]
  );

  const filtered = useMemo(() => {
    if (filter === "today") return teamAppointments.filter((a) => a.date === today);
    return teamAppointments.filter((a) => new Date(a.date) >= weekStart);
  }, [teamAppointments, filter, today]);

  const stats = useMemo(() => {
    const todayAppts = teamAppointments.filter((a) => a.date === today);
    const confirmed = todayAppts.filter((a) => a.status === "Confirmé" || a.status === "Fermé").length;
    return {
      total: todayAppts.length,
      confirmed,
      noShows: todayAppts.filter((a) => a.status === "Absence").length,
      rate: todayAppts.length > 0 ? Math.round((confirmed / todayAppts.length) * 100) : 0,
    };
  }, [teamAppointments, today]);

  const getRepName = (repId: string) => SALES_REPS.find((r) => r.id === repId)?.name || repId;

  const statusColors: Record<string, string> = {
    "En attente": "bg-warning/20 text-warning",
    "Confirmé": "bg-primary/20 text-primary",
    "Absence": "bg-destructive/20 text-destructive",
    "Fermé": "bg-info/20 text-info",
    "Annulé": "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Rendez-vous aujourd'hui", value: stats.total, icon: CalendarCheck, color: "text-primary" },
          { label: "Confirmés aujourd'hui", value: stats.confirmed, icon: CheckCircle2, color: "text-primary" },
          { label: "Absences", value: stats.noShows, icon: XCircle, color: "text-destructive" },
          { label: "Taux de confirmation", value: `${stats.rate}%`, icon: TrendingUp, color: "text-info" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Daily target */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Objectif du jour</span>
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div className="text-2xl font-bold text-foreground">{stats.total}/{dailyTarget}</div>
        <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min(100, (stats.total / dailyTarget) * 100)}%` }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["today", "week"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {f === "today" ? "Aujourd'hui" : "Cette semaine"}
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate("/add-appointment")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Nouveau rendez-vous
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Client", "Téléphone", "Adresse", "Heure", "Représentant", "Statut", "Notes", "SMS"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{a.clientFirstName} {a.clientLastName}</td>
                  <td className="px-4 py-3 text-foreground">{a.phone}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      {a.address.substring(0, 35)}…
                    </a>
                  </td>
                  <td className="px-4 py-3 text-foreground">{a.time}</td>
                  <td className="px-4 py-3 text-foreground">{getRepName(a.repId)}</td>
                  <td className="px-4 py-3">
                    {(role === "proprietaire" || role === "gestionnaire") ? (
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value as any)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[a.status]} bg-opacity-100`}
                      >
                        {["En attente", "Confirmé", "Absence", "Fermé", "Annulé"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                        {a.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">{a.notes}</td>
                  <td className="px-4 py-3">
                    {a.smsScheduled && (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <Bell className="h-3 w-3" /> Planifié
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Aucun rendez-vous trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
