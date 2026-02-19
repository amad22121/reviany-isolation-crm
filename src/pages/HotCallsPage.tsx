import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS, HOT_CALL_STATUSES, HotCallStatus } from "@/data/crm-data";
import {
  Phone,
  Search,
  Flame,
  CalendarCheck,
  TrendingUp,
  RotateCcw,
  Hash,
  Check,
  Trash2,
} from "lucide-react";

const HotCallsPage = () => {
  const { hotCalls, updateHotCallStatus, updateHotCallNotes, deleteHotCall } = useCrm();
  const { role, currentRepId } = useAuth();

  const [view, setView] = useState<"all" | "today">("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Permission filter
  const visibleCalls = useMemo(() => {
    if (role === "representant") return hotCalls.filter((h) => h.repId === currentRepId);
    return hotCalls;
  }, [hotCalls, role, currentRepId]);

  // Cities for filter
  const cities = useMemo(() => [...new Set(visibleCalls.map((h) => h.city))].sort(), [visibleCalls]);

  // Today's calls logic
  const todayCalls = useMemo(
    () =>
      visibleCalls.filter(
        (h) =>
          h.followUpDate === today ||
          (h.status === "No answer" && h.lastContactDate === yesterday) ||
          (h.status === "Call back later" && h.followUpDate <= today)
      ),
    [visibleCalls, today, yesterday]
  );

  const displayCalls = view === "today" ? todayCalls : visibleCalls;

  const filtered = useMemo(() => {
    return displayCalls.filter((h) => {
      if (statusFilter !== "all" && h.status !== statusFilter) return false;
      if (repFilter !== "all" && h.repId !== repFilter) return false;
      if (cityFilter !== "all" && h.city !== cityFilter) return false;
      if (sourceFilter !== "all" && h.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !`${h.clientFirstName} ${h.clientLastName}`.toLowerCase().includes(q) &&
          !h.phone.includes(q) &&
          !h.address.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [displayCalls, statusFilter, repFilter, cityFilter, sourceFilter, search]);

  // Weekly stats
  const startOfWeek = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().split("T")[0];
  }, []);

  const weekStats = useMemo(() => {
    const weekCalls = visibleCalls.filter((h) => h.createdAt >= startOfWeek);
    const rebooked = visibleCalls.filter((h) => h.status === "Booked" && h.lastContactDate >= startOfWeek);
    const totalAttempts = visibleCalls.reduce((s, h) => s + h.attempts, 0);
    const avgAttempts = visibleCalls.length > 0 ? (totalAttempts / visibleCalls.length).toFixed(1) : "0";
    const recoveryRate = weekCalls.length > 0 ? Math.round((rebooked.length / weekCalls.length) * 100) : 0;
    return {
      total: weekCalls.length,
      rebooked: rebooked.length,
      recoveryRate,
      avgAttempts,
    };
  }, [visibleCalls, startOfWeek]);

  const getRepName = (repId: string) => SALES_REPS.find((r) => r.id === repId)?.name || repId;

  const handleSaveNote = (id: string) => {
    updateHotCallNotes(id, noteInput);
    setEditingNoteId(null);
  };

  const statusColors: Record<string, string> = {
    "No answer": "bg-warning/20 text-warning",
    "Call back later": "bg-info/20 text-info",
    "Reschedule requested": "bg-primary/20 text-primary",
    "Not interested": "bg-muted text-muted-foreground",
    "Follow-up 3 months": "bg-accent text-accent-foreground",
    "Follow-up 6 months": "bg-accent text-accent-foreground",
    "Follow-up 9 months": "bg-accent text-accent-foreground",
    "Follow-up 12 months": "bg-accent text-accent-foreground",
    Booked: "bg-primary/20 text-primary",
    Closed: "bg-secondary text-secondary-foreground",
    Dead: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Flame className="h-6 w-6 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Hot Calls</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Hot calls cette semaine", value: weekStats.total, icon: Flame, color: "text-destructive" },
          { label: "Re-bookés cette semaine", value: weekStats.rebooked, icon: CalendarCheck, color: "text-primary" },
          { label: "Taux de récupération", value: `${weekStats.recoveryRate}%`, icon: TrendingUp, color: "text-info" },
          { label: "Tentatives moy./lead", value: weekStats.avgAttempts, icon: RotateCcw, color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* View toggle + filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {(["today", "all"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {v === "today" ? "Appels du jour" : "Tous"}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tous les statuts</option>
          {HOT_CALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {role !== "representant" && (
          <select className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={repFilter} onChange={(e) => setRepFilter(e.target.value)}>
            <option value="all">Tous les reps</option>
            {SALES_REPS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}

        <select className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          <option value="all">Toutes les villes</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="all">Toutes les sources</option>
          <option value="Door-to-door">Door-to-door</option>
          <option value="Referral">Referral</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Client", "Téléphone", "Adresse", "Ville", "Source", "Rep", "Statut", "Tentatives", "Dernier contact", "Notes", ...(role === "proprietaire" ? [""] : [])].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-muted-foreground font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-3 py-3 font-medium text-foreground whitespace-nowrap">
                    {h.clientFirstName} {h.clientLastName}
                  </td>
                  <td className="px-3 py-3">
                    <a href={`tel:${h.phone.replace(/\D/g, "")}`} className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap">
                      <Phone className="h-3 w-3" /> {h.phone}
                    </a>
                  </td>
                  <td className="px-3 py-3 text-foreground text-xs max-w-[160px] truncate" title={h.address}>{h.address.substring(0, 30)}…</td>
                  <td className="px-3 py-3 text-foreground text-xs">{h.city}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{h.source}</td>
                  <td className="px-3 py-3 text-foreground text-xs">{getRepName(h.repId)}</td>
                  <td className="px-3 py-3">
                    <select
                      value={h.status}
                      onChange={(e) => updateHotCallStatus(h.id, e.target.value as HotCallStatus)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[h.status] || "bg-secondary text-secondary-foreground"}`}
                    >
                      {HOT_CALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3" /> {h.attempts}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-foreground text-xs">{h.lastContactDate}</td>
                  <td className="px-3 py-3 text-xs max-w-[150px]">
                    {editingNoteId === h.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveNote(h.id)}
                          className="flex-1 bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                        />
                        <button onClick={() => handleSaveNote(h.id)} className="text-primary hover:opacity-80">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingNoteId(h.id); setNoteInput(h.notes || ""); }}
                        className="text-left truncate max-w-[130px] text-muted-foreground hover:text-foreground"
                        title="Modifier"
                      >
                        {h.notes || "Ajouter…"}
                      </button>
                    )}
                  </td>
                  {role === "proprietaire" && (
                    <td className="px-3 py-3">
                      {deleteConfirm === h.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { deleteHotCall(h.id); setDeleteConfirm(null); }} className="text-xs text-destructive font-medium">Oui</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground">Non</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(h.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={role === "proprietaire" ? 11 : 10} className="px-4 py-8 text-center text-muted-foreground">
                    {view === "today" ? "Aucun appel prévu aujourd'hui" : "Aucun hot call trouvé"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HotCallsPage;
