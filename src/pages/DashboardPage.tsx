import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS, Appointment } from "@/data/crm-data";
import FicheClient from "@/components/FicheClient";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Target,
  TrendingUp,
  AlertTriangle,
  Pencil,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type Period = "7d" | "30d" | "month";
type SortKey = "name" | "generated" | "confirmed" | "noShow" | "closed" | "recovery";

const DashboardPage = () => {
  const { appointments, weeklyTarget, setWeeklyTarget } = useCrm();
  const { role, currentManagerId } = useAuth();
  const [period, setPeriod] = useState<Period>("7d");
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(String(weeklyTarget));
  const [sortKey, setSortKey] = useState<SortKey>("generated");
  const [sortAsc, setSortAsc] = useState(false);

  const canEdit = role === "proprietaire";
  const canView = role === "proprietaire" || role === "gestionnaire";

  const teamReps = useMemo(() => {
    if (role === "gestionnaire" && currentManagerId) {
      return SALES_REPS.filter((r) => r.managerId === currentManagerId);
    }
    return SALES_REPS;
  }, [role, currentManagerId]);

  const teamRepIds = useMemo(() => new Set(teamReps.map((r) => r.id)), [teamReps]);

  const periodStart = useMemo(() => {
    const now = new Date();
    if (period === "7d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.toISOString().split("T")[0];
    }
    if (period === "30d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d.toISOString().split("T")[0];
    }
    // month
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  }, [period]);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];

  const teamAppts = useMemo(
    () => appointments.filter((a) => teamRepIds.has(a.repId) && a.status !== "Backlog"),
    [appointments, teamRepIds]
  );

  const periodAppts = useMemo(
    () => teamAppts.filter((a) => a.date >= periodStart && a.date <= today),
    [teamAppts, periodStart, today]
  );

  // === SECTION 1: KPIs ===
  const kpis = useMemo(() => {
    const total = periodAppts.length;
    const confirmed = periodAppts.filter((a) => a.status === "Confirmé" || a.status === "Fermé").length;
    const noShows = periodAppts.filter((a) => a.status === "Absence").length;
    const closed = periodAppts.filter((a) => a.status === "Fermé").length;
    return {
      total,
      confirmRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      noShowRate: confirmed > 0 ? Math.round((noShows / confirmed) * 100) : 0,
      closed,
    };
  }, [periodAppts]);

  // === SECTION 2: Weekly objective ===
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split("T")[0];
  }, []);
  const weekAppts = useMemo(
    () => teamAppts.filter((a) => a.date >= weekStart),
    [teamAppts, weekStart]
  );
  const weekCount = weekAppts.length;
  const weekPct = weeklyTarget > 0 ? Math.min(100, Math.round((weekCount / weeklyTarget) * 100)) : 0;

  // === SECTION 3: Rep performance ===
  const repPerf = useMemo(() => {
    return teamReps.map((r) => {
      const ra = periodAppts.filter((a) => a.repId === r.id);
      const generated = ra.length;
      const confirmed = ra.filter((a) => a.status === "Confirmé" || a.status === "Fermé").length;
      const noShow = ra.filter((a) => a.status === "Absence").length;
      const closed = ra.filter((a) => a.status === "Fermé").length;
      // Recovery: no-shows that later got rebooked (simplified: count of re-confirmed after absence)
      const recovery = noShow > 0 ? Math.round((0 / noShow) * 100) : 0; // placeholder — real logic needs history
      return { id: r.id, name: r.name, generated, confirmed, noShow, closed, recovery };
    });
  }, [teamReps, periodAppts]);

  const sortedRepPerf = useMemo(() => {
    const sorted = [...repPerf].sort((a, b) => {
      const va = a[sortKey === "name" ? "name" : sortKey];
      const vb = b[sortKey === "name" ? "name" : sortKey];
      if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb);
      return (va as number) - (vb as number);
    });
    return sortAsc ? sorted : sorted.reverse();
  }, [repPerf, sortKey, sortAsc]);

  // === SECTION 4: Alerts ===
  const alerts = useMemo(() => {
    const items: { label: string; type: "warning" | "danger" }[] = [];
    const tomorrowAtRisk = teamAppts.filter((a) => a.date === tomorrow && a.status === "En attente");
    if (tomorrowAtRisk.length > 0)
      items.push({ label: `${tomorrowAtRisk.length} RDV à risque demain (non confirmés)`, type: "warning" });
    const noShowNotFollowed = teamAppts.filter(
      (a) => a.status === "Absence" && a.date >= threeDaysAgo
    );
    if (noShowNotFollowed.length > 0)
      items.push({ label: `${noShowNotFollowed.length} no-show non rappelés`, type: "danger" });
    const staleLeads = teamAppts.filter(
      (a) => a.status === "En attente" && a.date < threeDaysAgo
    );
    if (staleLeads.length > 0)
      items.push({ label: `${staleLeads.length} leads sans suivi depuis +3 jours`, type: "danger" });
    return items;
  }, [teamAppts, tomorrow, threeDaysAgo]);

  // === SECTION 5: Recent RDV ===
  const recentAppts = useMemo(
    () => [...teamAppts].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).slice(0, 10),
    [teamAppts]
  );

  const getRepName = (repId: string) => SALES_REPS.find((r) => r.id === repId)?.name || repId;

  const handleSaveTarget = () => {
    const val = parseInt(targetInput);
    if (!isNaN(val) && val > 0) setWeeklyTarget(val);
    setEditingTarget(false);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />;
  };

  const statusColors: Record<string, string> = {
    "En attente": "bg-warning/20 text-warning",
    "Confirmé": "bg-primary/20 text-primary",
    "Absence": "bg-destructive/20 text-destructive",
    "Fermé": "bg-info/20 text-info",
    "Annulé": "bg-muted text-muted-foreground",
  };

  const periodLabels: Record<Period, string> = { "7d": "7 jours", "30d": "30 jours", month: "Ce mois" };

  return (
    <>
      <div className="space-y-6">
        {/* Period filter */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Santé globale</h2>
          <div className="flex gap-2">
            {(["7d", "30d", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 1 — KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "RDV générés", value: kpis.total, icon: CalendarCheck, color: "text-primary" },
            { label: "Taux de confirmation", value: `${kpis.confirmRate}%`, icon: CheckCircle2, color: "text-primary" },
            { label: "Taux de no-show", value: `${kpis.noShowRate}%`, icon: XCircle, color: "text-destructive" },
            { label: "RDV closés", value: kpis.closed, icon: TrendingUp, color: "text-info" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="text-3xl font-bold text-foreground">{s.value}</div>
            </div>
          ))}
        </div>

        {/* SECTION 2 — Weekly Objective */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Objectif semaine</span>
            </div>
            {editingTarget && canEdit ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTarget()}
                  className="w-16 bg-secondary border border-border rounded px-2 py-1 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <button onClick={handleSaveTarget} className="text-primary hover:opacity-80">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{weekCount} / {weeklyTarget} RDV</span>
                {canEdit && (
                  <button
                    onClick={() => { setTargetInput(String(weeklyTarget)); setEditingTarget(true); }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${weekPct}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-muted-foreground">{weekPct}%</div>
        </div>

        {/* SECTION 3 — Rep Performance */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Performance par représentant</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {([
                    ["name", "Représentant"],
                    ["generated", "RDV générés"],
                    ["confirmed", "Confirmés"],
                    ["noShow", "No-show"],
                    ["closed", "Closés"],
                    ["recovery", "Taux récup."],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="text-left px-4 py-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors select-none"
                    >
                      {label}<SortIcon col={key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRepPerf.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-4 py-3 text-foreground">{r.generated}</td>
                    <td className="px-4 py-3 text-foreground">{r.confirmed}</td>
                    <td className="px-4 py-3 text-foreground">{r.noShow}</td>
                    <td className="px-4 py-3 text-foreground">{r.closed}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.recovery}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4 — Alerts */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="text-sm font-medium text-foreground">Zone d'alerte</h3>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune alerte critique</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a, i) => (
                <li
                  key={i}
                  className={`text-sm px-3 py-2 rounded-lg ${
                    a.type === "danger"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {a.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SECTION 5 — Recent RDV */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">RDV récents</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Client", "Représentant", "Statut", "Date", "Heure"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentAppts.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedAppt(a)} className="text-primary hover:underline text-left font-medium">{a.fullName}</button>
                    </td>
                    <td className="px-4 py-3 text-foreground">{getRepName(a.repId)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status] || ""}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{a.date}</td>
                    <td className="px-4 py-3 text-foreground">{a.time}</td>
                  </tr>
                ))}
                {recentAppts.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucun rendez-vous</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <FicheClient appointment={selectedAppt} open={!!selectedAppt} onOpenChange={(o) => !o && setSelectedAppt(null)} />
    </>
  );
};

export default DashboardPage;
