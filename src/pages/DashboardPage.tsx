import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS, Appointment } from "@/data/crm-data";
import FicheClient from "@/components/FicheClient";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Target,
  Plus,
  Bell,
  TrendingUp,
  Pencil,
  Check,
} from "lucide-react";

const DashboardPage = () => {
  const { appointments, updateStatus, updateNotes, dailyTarget, setDailyTarget } = useCrm();
  const { role, currentManagerId } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"today" | "week">("today");
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(String(dailyTarget));
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const canEdit = role === "proprietaire" || role === "gestionnaire";

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

  const handleSaveTarget = () => {
    const val = parseInt(targetInput);
    if (!isNaN(val) && val > 0) setDailyTarget(val);
    setEditingTarget(false);
  };

  const handleSaveNote = (id: string) => {
    updateNotes(id, noteInput);
    setEditingNoteId(null);
    setSavedNoteId(id);
    setTimeout(() => setSavedNoteId(null), 1200);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Daily target */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Objectif du jour</span>
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <span className="text-muted-foreground text-lg">/</span>
            {editingTarget && canEdit ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTarget()}
                  className="w-16 bg-secondary border border-border rounded px-2 py-1 text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <button onClick={handleSaveTarget} className="text-primary hover:opacity-80">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{dailyTarget}</span>
                {canEdit && (
                  <button
                    onClick={() => { setTargetInput(String(dailyTarget)); setEditingTarget(true); }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
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

        {/* Table (moved to top priority) */}
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
                    <td className="px-4 py-3 font-medium">
                      <button onClick={() => setSelectedAppt(a)} className="text-primary hover:underline text-left">{a.clientFirstName} {a.clientLastName}</button>
                    </td>
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
                      {canEdit ? (
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
                    <td className="px-4 py-3 text-xs max-w-[180px]">
                      {editingNoteId === a.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveNote(a.id)}
                            className="flex-1 bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                          />
                          <button onClick={() => handleSaveNote(a.id)} className="text-primary hover:opacity-80">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingNoteId(a.id); setNoteInput(a.notes || ""); }}
                          className={`text-left truncate max-w-[150px] transition-colors ${
                            savedNoteId === a.id
                              ? "text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="Cliquer pour modifier"
                        >
                          {savedNoteId === a.id ? "✓ Sauvegardé" : (a.notes || "Ajouter une note…")}
                        </button>
                      )}
                    </td>
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
      </div>

      <FicheClient appointment={selectedAppt} open={!!selectedAppt} onOpenChange={(o) => !o && setSelectedAppt(null)} />
    </>
  );
};

export default DashboardPage;
