import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS, Appointment } from "@/data/crm-data";
import { Navigate } from "react-router-dom";
import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Ban,
  TrendingUp,
  Lock,
  ArrowUpDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type DatePreset = "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "custom";

function getMonday(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day + (day === 0 ? -6 : 1));
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

function extractCity(appt: Appointment): string {
  if (appt.city) return appt.city;
  const parts = appt.address.split(",");
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 2].trim();
    return cityPart.replace(/\s+QC$/, "").trim();
  }
  return "Inconnu";
}

function getSource(appt: Appointment): string {
  return appt.source === "Referral" ? "Référencement" : "Door-to-door";
}

const StatistiquesPage = () => {
  const { appointments } = useCrm();
  const { role } = useAuth();

  const today = new Date();
  const todayKey = formatDateKey(today);

  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>("this_week");
  const [customStart, setCustomStart] = useState(todayKey);
  const [customEnd, setCustomEnd] = useState(todayKey);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sort state
  const [citySortKey, setCitySortKey] = useState<"total" | "confirmed" | "rate">("total");
  const [citySortDir, setCitySortDir] = useState<"asc" | "desc">("desc");
  const [repSortKey, setRepSortKey] = useState<"total" | "confirmed" | "rate">("total");
  const [repSortDir, setRepSortDir] = useState<"asc" | "desc">("desc");

  // Date range computation
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: string, end: string;
    switch (datePreset) {
      case "today":
        start = end = todayKey;
        break;
      case "yesterday": {
        const y = new Date(now); y.setDate(y.getDate() - 1);
        start = end = formatDateKey(y);
        break;
      }
      case "this_week": {
        const mon = getMonday(now);
        start = formatDateKey(mon);
        end = todayKey;
        break;
      }
      case "last_week": {
        const mon = getMonday(now);
        mon.setDate(mon.getDate() - 7);
        start = formatDateKey(mon);
        const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
        end = formatDateKey(sun);
        break;
      }
      case "this_month": {
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        end = todayKey;
        break;
      }
      case "custom":
        start = customStart;
        end = customEnd;
        break;
      default:
        start = end = todayKey;
    }
    return { start, end };
  }, [datePreset, customStart, customEnd, todayKey]);

  // Filtered appointments
  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (a.status === "Backlog") return false;
      if (sourceFilter !== "all") {
        const src = getSource(a);
        if (src !== sourceFilter) return false;
      }
      if (cityFilter !== "all" && extractCity(a) !== cityFilter) return false;
      if (repFilter !== "all" && a.repId !== repFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
  }, [appointments, dateRange, sourceFilter, cityFilter, repFilter, statusFilter]);

  // Dynamic filter options
  const allCities = useMemo(() => [...new Set(appointments.map(extractCity))].sort(), [appointments]);

  // KPIs
  const kpis = useMemo(() => {
    const total = filtered.length;
    const confirmed = filtered.filter((a) => a.status === "Confirmé").length;
    const atRisk = filtered.filter((a) => a.status === "Absence").length;
    const cancelled = filtered.filter((a) => a.status === "Annulé").length;
    const noShow = filtered.filter((a) => a.status === "Absence").length;
    const closed = filtered.filter((a) => a.status === "Fermé").length;
    const confirmRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;
    return { total, confirmed, atRisk, cancelled, noShow, closed, confirmRate, noShowRate };
  }, [filtered]);

  // Source breakdown
  const sourceBreakdown = useMemo(() => {
    const groups: Record<string, { total: number; confirmed: number }> = {
      "Door-to-door": { total: 0, confirmed: 0 },
      "Référencement": { total: 0, confirmed: 0 },
    };
    filtered.forEach((a) => {
      const src = getSource(a);
      if (!groups[src]) groups[src] = { total: 0, confirmed: 0 };
      groups[src].total++;
      if (a.status === "Confirmé") groups[src].confirmed++;
    });
    return Object.entries(groups).map(([source, data]) => ({
      source,
      ...data,
      rate: data.total > 0 ? Math.round((data.confirmed / data.total) * 100) : 0,
    }));
  }, [filtered]);

  // City breakdown
  const cityBreakdown = useMemo(() => {
    const groups: Record<string, { total: number; confirmed: number; atRisk: number; noShow: number }> = {};
    filtered.forEach((a) => {
      const city = extractCity(a);
      if (!groups[city]) groups[city] = { total: 0, confirmed: 0, atRisk: 0, noShow: 0 };
      groups[city].total++;
      if (a.status === "Confirmé") groups[city].confirmed++;
      if (a.status === "Absence") { groups[city].atRisk++; groups[city].noShow++; }
    });
    const arr = Object.entries(groups).map(([city, d]) => ({
      city,
      ...d,
      rate: d.total > 0 ? Math.round((d.confirmed / d.total) * 100) : 0,
    }));
    arr.sort((a, b) => {
      const av = citySortKey === "rate" ? a.rate : citySortKey === "confirmed" ? a.confirmed : a.total;
      const bv = citySortKey === "rate" ? b.rate : citySortKey === "confirmed" ? b.confirmed : b.total;
      return citySortDir === "desc" ? bv - av : av - bv;
    });
    return arr;
  }, [filtered, citySortKey, citySortDir]);

  // Rep breakdown
  const repBreakdown = useMemo(() => {
    const groups: Record<string, { total: number; confirmed: number; atRisk: number; noShow: number }> = {};
    filtered.forEach((a) => {
      if (!groups[a.repId]) groups[a.repId] = { total: 0, confirmed: 0, atRisk: 0, noShow: 0 };
      groups[a.repId].total++;
      if (a.status === "Confirmé") groups[a.repId].confirmed++;
      if (a.status === "Absence") { groups[a.repId].atRisk++; groups[a.repId].noShow++; }
    });
    const arr = Object.entries(groups).map(([repId, d]) => ({
      repId,
      name: SALES_REPS.find((r) => r.id === repId)?.name || repId,
      ...d,
      rate: d.total > 0 ? Math.round((d.confirmed / d.total) * 100) : 0,
    }));
    arr.sort((a, b) => {
      const av = repSortKey === "rate" ? a.rate : repSortKey === "confirmed" ? a.confirmed : a.total;
      const bv = repSortKey === "rate" ? b.rate : repSortKey === "confirmed" ? b.confirmed : b.total;
      return repSortDir === "desc" ? bv - av : av - bv;
    });
    return arr;
  }, [filtered, repSortKey, repSortDir]);

  // Trend data
  const trendData = useMemo(() => {
    const dayMap: Record<string, { total: number; confirmed: number; noShow: number }> = {};
    filtered.forEach((a) => {
      if (!dayMap[a.date]) dayMap[a.date] = { total: 0, confirmed: 0, noShow: 0 };
      dayMap[a.date].total++;
      if (a.status === "Confirmé") dayMap[a.date].confirmed++;
      if (a.status === "Absence") dayMap[a.date].noShow++;
    });
    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date: date.slice(5), ...d }));
  }, [filtered]);

  const toggleCitySort = (key: typeof citySortKey) => {
    if (citySortKey === key) setCitySortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setCitySortKey(key); setCitySortDir("desc"); }
  };

  const toggleRepSort = (key: typeof repSortKey) => {
    if (repSortKey === key) setRepSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setRepSortKey(key); setRepSortDir("desc"); }
  };

  const SortButton = ({ label, active, dir, onClick }: { label: string; active: boolean; dir: string; onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center gap-1 text-left">
      <span>{label}</span>
      <ArrowUpDown className={`h-3 w-3 ${active ? "text-primary" : "text-muted-foreground/50"}`} />
    </button>
  );

  const selectClass = "bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  // Block reps (after all hooks)
  if (role === "representant") return <Navigate to="/rep" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Statistiques</h1>
      </div>

      {/* FILTERS */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Période</label>
            <select className={selectClass} value={datePreset} onChange={(e) => setDatePreset(e.target.value as DatePreset)}>
              <option value="today">Aujourd'hui</option>
              <option value="yesterday">Hier</option>
              <option value="this_week">Cette semaine</option>
              <option value="last_week">Semaine dernière</option>
              <option value="this_month">Ce mois</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>
          {datePreset === "custom" && (
            <>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Du</label>
                <input type="date" className={selectClass} value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Au</label>
                <input type="date" className={selectClass} value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
              </div>
            </>
          )}
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Source</label>
            <select className={selectClass} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="all">Toutes</option>
              <option value="Door-to-door">Door-to-door</option>
              <option value="Référencement">Référencement</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Ville</label>
            <select className={selectClass} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="all">Toutes</option>
              {allCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Représentant</label>
            <select className={selectClass} value={repFilter} onChange={(e) => setRepFilter(e.target.value)}>
              <option value="all">Tous</option>
              {SALES_REPS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Statut</label>
            <select className={selectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tous</option>
              <option value="Confirmé">Confirmé</option>
              <option value="En attente">En attente</option>
              <option value="Absence">Absence / No-show</option>
              <option value="Fermé">Fermé</option>
              <option value="Annulé">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          { label: "Total RDV", value: kpis.total, icon: CalendarCheck, color: "text-primary" },
          { label: "Confirmés", value: kpis.confirmed, icon: CheckCircle2, color: "text-green-400" },
          { label: "À risque", value: kpis.atRisk, icon: AlertTriangle, color: "text-destructive" },
          { label: "Annulés", value: kpis.cancelled, icon: Ban, color: "text-muted-foreground" },
          { label: "No-show", value: kpis.noShow, icon: XCircle, color: "text-orange-400" },
          { label: "Taux confirm.", value: `${kpis.confirmRate}%`, icon: TrendingUp, color: "text-green-400" },
          { label: "Taux no-show", value: `${kpis.noShowRate}%`, icon: TrendingUp, color: "text-orange-400" },
          { label: "Closés", value: kpis.closed > 0 ? kpis.closed : "À venir", icon: Lock, color: "text-info", note: kpis.closed === 0 },
        ].map((s) => (
          <div key={s.label} className="glass-card p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground leading-tight">{s.label}</span>
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
            </div>
            <div className="text-xl font-bold text-foreground">{s.value}</div>
            {"note" in s && s.note && (
              <p className="text-[9px] text-muted-foreground mt-1">Activé au backend</p>
            )}
          </div>
        ))}
      </div>

      {/* SOURCE + TREND side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance par source */}
        <div className="glass-card p-4">
          <h2 className="text-sm font-medium text-foreground mb-3">Performance par source</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">Source</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">Total</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">Confirmés</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">Taux</th>
              </tr>
            </thead>
            <tbody>
              {sourceBreakdown.map((s) => (
                <tr key={s.source} className="border-b border-border/50">
                  <td className="px-3 py-2.5 text-foreground font-medium">{s.source}</td>
                  <td className="px-3 py-2.5 text-foreground">{s.total}</td>
                  <td className="px-3 py-2.5 text-foreground">{s.confirmed}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${s.rate}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{s.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Trend chart */}
        <div className="glass-card p-4">
          <h2 className="text-sm font-medium text-foreground mb-3">Évolution</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 20%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215 14% 55%)" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(215 14% 55%)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220 18% 13%)",
                    border: "1px solid hsl(220 14% 20%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="total" stroke="hsl(142 64% 45%)" strokeWidth={2} name="Total" dot={false} />
                <Line type="monotone" dataKey="confirmed" stroke="hsl(142 70% 55%)" strokeWidth={2} name="Confirmés" dot={false} />
                <Line type="monotone" dataKey="noShow" stroke="hsl(0 72% 51%)" strokeWidth={2} name="No-show" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Aucune donnée pour cette période</div>
          )}
        </div>
      </div>

      {/* CITY TABLE */}
      <div className="glass-card p-4">
        <h2 className="text-sm font-medium text-foreground mb-3">Performance par ville</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">Ville</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">
                  <SortButton label="Total" active={citySortKey === "total"} dir={citySortDir} onClick={() => toggleCitySort("total")} />
                </th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">
                  <SortButton label="Confirmés" active={citySortKey === "confirmed"} dir={citySortDir} onClick={() => toggleCitySort("confirmed")} />
                </th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">À risque</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">
                  <SortButton label="Taux" active={citySortKey === "rate"} dir={citySortDir} onClick={() => toggleCitySort("rate")} />
                </th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">No-show</th>
              </tr>
            </thead>
            <tbody>
              {cityBreakdown.map((c) => (
                <tr
                  key={c.city}
                  className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => setCityFilter(c.city)}
                >
                  <td className="px-3 py-2.5 text-primary font-medium">{c.city}</td>
                  <td className="px-3 py-2.5 text-foreground">{c.total}</td>
                  <td className="px-3 py-2.5 text-foreground">{c.confirmed}</td>
                  <td className="px-3 py-2.5 text-foreground">{c.atRisk}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${c.rate}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{c.rate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-foreground">{c.noShow}</td>
                </tr>
              ))}
              {cityBreakdown.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REP TABLE */}
      <div className="glass-card p-4">
        <h2 className="text-sm font-medium text-foreground mb-3">Performance par représentant</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">Représentant</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">
                  <SortButton label="Total" active={repSortKey === "total"} dir={repSortDir} onClick={() => toggleRepSort("total")} />
                </th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">
                  <SortButton label="Confirmés" active={repSortKey === "confirmed"} dir={repSortDir} onClick={() => toggleRepSort("confirmed")} />
                </th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">À risque</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">
                  <SortButton label="Taux" active={repSortKey === "rate"} dir={repSortDir} onClick={() => toggleRepSort("rate")} />
                </th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">No-show</th>
              </tr>
            </thead>
            <tbody>
              {repBreakdown.map((r) => (
                <tr
                  key={r.repId}
                  className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => setRepFilter(r.repId)}
                >
                  <td className="px-3 py-2.5 text-primary font-medium">{r.name}</td>
                  <td className="px-3 py-2.5 text-foreground">{r.total}</td>
                  <td className="px-3 py-2.5 text-foreground">{r.confirmed}</td>
                  <td className="px-3 py-2.5 text-foreground">{r.atRisk}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${r.rate}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{r.rate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-foreground">{r.noShow}</td>
                </tr>
              ))}
              {repBreakdown.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatistiquesPage;
