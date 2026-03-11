import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { Appointment, AppointmentStatus, APPOINTMENT_STATUS_LABELS } from "@/data/crm-data";
import { useAppointments } from "@/hooks/useAppointments";
import { useTeamMembers, getRepNameFromList } from "@/hooks/useTeamMembers";
import FicheClient from "@/components/FicheClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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
  CalendarIcon,
} from "lucide-react";

type Period = "7d" | "30d" | "month";
type SortKey = "name" | "generated" | "confirmed" | "atRisk" | "closed" | "cancelled";
type DayPreset = "today" | "yesterday" | "before" | "custom";

const toDateStr = (d: Date) => d.toISOString().split("T")[0];

const DashboardPage = () => {
  const { dailyTarget, setDailyTarget, repGoals, setRepGoal } = useCrm();
  const { data: appointments = [] } = useAppointments();
  const { role, currentManagerId } = useAuth();

  const [period, setPeriod] = useState<Period>("7d");
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("generated");
  const [sortAsc, setSortAsc] = useState(false);

  const [dayPreset, setDayPreset] = useState<DayPreset>("today");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [editingDailyTarget, setEditingDailyTarget] = useState(false);
  const [dailyTargetInput, setDailyTargetInput] = useState(String(dailyTarget));
  const [editingRepGoal, setEditingRepGoal] = useState<string | null>(null);
  const [repGoalInput, setRepGoalInput] = useState("");

  const canEditTarget = role === "proprietaire";
  const canEditRepGoals = role === "proprietaire";

  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  const beforeYesterday = toDateStr(new Date(Date.now() - 2 * 86400000));
  const tomorrow = toDateStr(new Date(Date.now() + 86400000));
  const threeDaysAgo = toDateStr(new Date(Date.now() - 3 * 86400000));

  const selectedDay = useMemo(() => {
    if (dayPreset === "today") return today;
    if (dayPreset === "yesterday") return yesterday;
    if (dayPreset === "before") return beforeYesterday;
    if (dayPreset === "custom" && customDate) return toDateStr(customDate);
    return today;
  }, [dayPreset, customDate, today, yesterday, beforeYesterday]);

  const { data: teamMembers = [] } = useTeamMembers();

  const teamReps = useMemo(() => {
    return teamMembers.map(m => ({ id: m.id, name: m.name, avatar: (m.name || "??").slice(0, 2).toUpperCase(), managerId: undefined }));
  }, [teamMembers]);

  const teamRepIds = useMemo(() => new Set(teamReps.map((r) => r.id)), [teamReps]);

  const teamAppts = useMemo(
    () => appointments.filter((a) => teamRepIds.has(a.repId) && a.status !== AppointmentStatus.BACKLOG),
    [appointments, teamRepIds]
  );

  // Daily KPIs
  const dayAppts = useMemo(
    () => teamAppts.filter((a) => a.date === selectedDay),
    [teamAppts, selectedDay]
  );

  const dailyKpis = useMemo(() => {
    const total = dayAppts.length;
    const confirmed = dayAppts.filter((a) => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.CLOSED).length;
    const atRisk = dayAppts.filter((a) => a.status === AppointmentStatus.AT_RISK).length;
    const closed = dayAppts.filter((a) => a.status === AppointmentStatus.CLOSED).length;
    return {
      total,
      confirmRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      atRisk,
      closed,
    };
  }, [dayAppts]);

  // Today appts for objective
  const todayAppts = useMemo(
    () => teamAppts.filter((a) => a.date === today),
    [teamAppts, today]
  );
  const todayCount = todayAppts.length;
  const dailyPct = dailyTarget > 0 ? Math.min(100, Math.round((todayCount / dailyTarget) * 100)) : 0;

  // Period KPIs
  const periodStart = useMemo(() => {
    const now = new Date();
    if (period === "7d") { const d = new Date(now); d.setDate(d.getDate() - 7); return toDateStr(d); }
    if (period === "30d") { const d = new Date(now); d.setDate(d.getDate() - 30); return toDateStr(d); }
    return toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  }, [period]);

  const periodAppts = useMemo(
    () => teamAppts.filter((a) => a.date >= periodStart && a.date <= today),
    [teamAppts, periodStart, today]
  );

  const kpis = useMemo(() => {
    const total = periodAppts.length;
    const confirmed = periodAppts.filter((a) => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.CLOSED).length;
    const atRisk = periodAppts.filter((a) => a.status === AppointmentStatus.AT_RISK).length;
    const closed = periodAppts.filter((a) => a.status === AppointmentStatus.CLOSED).length;
    const cancelled = periodAppts.filter((a) => a.status === AppointmentStatus.CANCELLED_CALLBACK || a.status === AppointmentStatus.CANCELLED_FINAL).length;
    return {
      total,
      confirmRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      atRisk,
      closed,
      cancelled,
    };
  }, [periodAppts]);

  // Rep performance (period)
  const repPerf = useMemo(() => {
    return teamReps.map((r) => {
      const ra = periodAppts.filter((a) => a.repId === r.id);
      const generated = ra.length;
      const confirmed = ra.filter((a) => a.status === AppointmentStatus.CONFIRMED || a.status === AppointmentStatus.CLOSED).length;
      const atRisk = ra.filter((a) => a.status === AppointmentStatus.AT_RISK).length;
      const closed = ra.filter((a) => a.status === AppointmentStatus.CLOSED).length;
      const cancelled = ra.filter((a) => a.status === AppointmentStatus.CANCELLED_CALLBACK || a.status === AppointmentStatus.CANCELLED_FINAL).length;
      return { id: r.id, name: r.name, generated, confirmed, atRisk, closed, cancelled };
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

  // Alerts
  const alerts = useMemo(() => {
    const items: { label: string; type: "warning" | "danger" }[] = [];
    const tomorrowAtRisk = teamAppts.filter((a) => a.date === tomorrow && (a.status === AppointmentStatus.PLANNED || a.status === AppointmentStatus.UNCONFIRMED || a.status === AppointmentStatus.AT_RISK));
    if (tomorrowAtRisk.length > 0)
      items.push({ label: `${tomorrowAtRisk.length} RDV à risque demain`, type: "warning" });
    const atRiskRecent = teamAppts.filter((a) => a.status === AppointmentStatus.AT_RISK && a.date >= threeDaysAgo);
    if (atRiskRecent.length > 0)
      items.push({ label: `${atRiskRecent.length} RDV à risque récents`, type: "danger" });
    const staleLeads = teamAppts.filter((a) => a.status === AppointmentStatus.PLANNED && a.date < threeDaysAgo);
    if (staleLeads.length > 0)
      items.push({ label: `${staleLeads.length} leads sans suivi depuis +3 jours`, type: "danger" });
    return items;
  }, [teamAppts, tomorrow, threeDaysAgo]);

  // Recent RDV
  const recentAppts = useMemo(
    () => [...teamAppts].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).slice(0, 10),
    [teamAppts]
  );

  const getRepName = (repId: string) => getRepNameFromList(teamMembers, repId);

  const handleSaveDailyTarget = () => {
    const val = parseInt(dailyTargetInput);
    if (!isNaN(val) && val > 0) setDailyTarget(val);
    setEditingDailyTarget(false);
  };

  const handleSaveRepGoal = (repId: string) => {
    const val = parseInt(repGoalInput);
    if (!isNaN(val) && val >= 0) setRepGoal(repId, val);
    setEditingRepGoal(null);
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
    [AppointmentStatus.PLANNED]: "bg-warning/20 text-warning",
    [AppointmentStatus.CONFIRMED]: "bg-green-500/20 text-green-400",
    [AppointmentStatus.UNCONFIRMED]: "bg-orange-300/20 text-orange-300",
    [AppointmentStatus.AT_RISK]: "bg-destructive/20 text-destructive",
    [AppointmentStatus.POSTPONED]: "bg-blue-400/20 text-blue-400",
    [AppointmentStatus.CANCELLED_CALLBACK]: "bg-amber-500/20 text-amber-400",
    [AppointmentStatus.CANCELLED_FINAL]: "bg-muted text-muted-foreground",
    [AppointmentStatus.NO_SHOW]: "bg-red-400/20 text-red-400",
    [AppointmentStatus.CLOSED]: "bg-info/20 text-info",
  };

  const periodLabels: Record<Period, string> = { "7d": "7 jours", "30d": "30 jours", month: "Ce mois" };

  const dayPresetLabels: Record<DayPreset, string> = {
    today: "Aujourd'hui",
    yesterday: "Hier",
    before: "Avant-hier",
    custom: "Autre",
  };

  return (
    <>
      <div className="space-y-6">

        {/* Empty state when no data */}
        {teamAppts.length === 0 && teamReps.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <CalendarCheck className="h-12 w-12 text-muted-foreground/40" />
              <h2 className="text-lg font-semibold text-foreground">Bienvenue dans votre tableau de bord</h2>
              <p className="text-muted-foreground text-sm max-w-md">
                Aucune donnée pour le moment. Commencez par ajouter des représentants et créer des rendez-vous pour voir vos statistiques ici.
              </p>
              <div className="flex gap-3">
                <a href="/users" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                  Ajouter des représentants
                </a>
                <a href="/add-appointment" className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
                  Créer un rendez-vous
                </a>
              </div>
            </div>
          </div>
        )}

        {(teamAppts.length > 0 || teamReps.length > 0) && (<>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Performance journalière</h2>
            <div className="flex gap-2 items-center">
              {(["today", "yesterday", "before"] as DayPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setDayPreset(p)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    dayPreset === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {dayPresetLabels[p]}
                </button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dayPreset === "custom" ? "default" : "secondary"}
                    size="sm"
                    className="text-xs h-7 gap-1"
                  >
                    <CalendarIcon className="h-3 w-3" />
                    {dayPreset === "custom" && customDate
                      ? format(customDate, "d MMM", { locale: fr })
                      : "Autre"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={(d) => { setCustomDate(d); setDayPreset("custom"); }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "RDV générés", value: dailyKpis.total, icon: CalendarCheck, color: "text-primary" },
              { label: "Taux de confirmation", value: `${dailyKpis.confirmRate}%`, icon: CheckCircle2, color: "text-green-400" },
              { label: "À risque", value: dailyKpis.atRisk, icon: XCircle, color: "text-destructive" },
              { label: "Closé (ventes)", value: dailyKpis.closed, icon: TrendingUp, color: "text-info" },
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
        </div>

        {/* ===== SECTION 2 — Objectif du jour (global) ===== */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Objectif du jour</span>
            </div>
            {editingDailyTarget && canEditTarget ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={dailyTargetInput}
                  onChange={(e) => setDailyTargetInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveDailyTarget()}
                  className="w-16 bg-secondary border border-border rounded px-2 py-1 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <button onClick={handleSaveDailyTarget} className="text-primary hover:opacity-80">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{todayCount} / {dailyTarget} RDV</span>
                {canEditTarget && (
                  <button
                    onClick={() => { setDailyTargetInput(String(dailyTarget)); setEditingDailyTarget(true); }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${dailyPct}%` }} />
          </div>
          <div className="mt-1 text-right text-xs text-muted-foreground">{dailyPct}%</div>
        </div>

        {/* ===== SECTION 3 — Objectifs journaliers individuels ===== */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Objectifs journaliers individuels</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamReps.map((r) => {
              const repTodayCount = todayAppts.filter((a) => a.repId === r.id).length;
              const goal = repGoals[r.id] || 0;
              const pct = goal > 0 ? Math.min(100, Math.round((repTodayCount / goal) * 100)) : 0;
              return (
                <div key={r.id} className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{r.name}</span>
                    {editingRepGoal === r.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={repGoalInput}
                          onChange={(e) => setRepGoalInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveRepGoal(r.id)}
                          className="w-12 bg-background border border-border rounded px-1 py-0.5 text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-center"
                          autoFocus
                        />
                        <button onClick={() => handleSaveRepGoal(r.id)} className="text-primary hover:opacity-80">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (canEditRepGoals) {
                            setEditingRepGoal(r.id);
                            setRepGoalInput(String(goal));
                          }
                        }}
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          canEditRepGoals ? "text-muted-foreground hover:text-primary cursor-pointer" : "text-muted-foreground cursor-default"
                        }`}
                      >
                        <span className="font-bold">{goal || "—"}</span>
                        {canEditRepGoals && <Pencil className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">{repTodayCount} / {goal || "—"} RDV</div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== SECTION 4 — Santé globale ===== */}
        <div>
          <div className="flex items-center justify-between mb-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "RDV générés", value: kpis.total, icon: CalendarCheck, color: "text-primary" },
              { label: "Taux de confirmation", value: `${kpis.confirmRate}%`, icon: CheckCircle2, color: "text-green-400" },
              { label: "À risque", value: kpis.atRisk, icon: XCircle, color: "text-destructive" },
              { label: "Closé (ventes)", value: kpis.closed, icon: TrendingUp, color: "text-info" },
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
        </div>

        {/* ===== SECTION 5 — Performance par représentant ===== */}
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
                    ["atRisk", "À risque"],
                    ["closed", "Closé"],
                    ["cancelled", "Annulés"],
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
                    <td className="px-4 py-3 text-foreground">{r.atRisk}</td>
                    <td className="px-4 py-3 text-foreground">{r.closed}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.cancelled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== SECTION 6 — RDV récents ===== */}
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status] || ""}`}>{APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}</span>
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
        </>)}
      </div>

      <FicheClient appointment={selectedAppt} open={!!selectedAppt} onOpenChange={(o) => !o && setSelectedAppt(null)} />
    </>
  );
};

export default DashboardPage;
