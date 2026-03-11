import { useMemo, useState } from "react";
import { useAuth } from "@/store/crm-store";
import { Appointment, APPOINTMENT_STATUSES, AppointmentStatus, APPOINTMENT_STATUS_LABELS } from "@/data/crm-data";
import { useAppointments, useUpdateAppointmentStatus, useUpdateAppointmentNotes } from "@/hooks/useAppointments";
import { useTeamMembers, getRepNameFromList } from "@/hooks/useTeamMembers";
import { Search, MapPin, Check, Plus, CalendarPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import FicheClient from "@/components/FicheClient";

const STATUS_PERMISSIONS: Record<string, AppointmentStatus[]> = {
  representant: [AppointmentStatus.PLANNED, AppointmentStatus.CONFIRMED],
  gestionnaire: [AppointmentStatus.PLANNED, AppointmentStatus.CONFIRMED, AppointmentStatus.UNCONFIRMED, AppointmentStatus.AT_RISK, AppointmentStatus.POSTPONED, AppointmentStatus.CANCELLED_CALLBACK, AppointmentStatus.CANCELLED_FINAL, AppointmentStatus.NO_SHOW, AppointmentStatus.CLOSED],
  proprietaire: [AppointmentStatus.PLANNED, AppointmentStatus.CONFIRMED, AppointmentStatus.UNCONFIRMED, AppointmentStatus.AT_RISK, AppointmentStatus.POSTPONED, AppointmentStatus.CANCELLED_CALLBACK, AppointmentStatus.CANCELLED_FINAL, AppointmentStatus.NO_SHOW, AppointmentStatus.CLOSED],
};

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const { data: appointments = [] } = useAppointments();
  const updateStatusMutation = useUpdateAppointmentStatus();
  const updateNotesMutation = useUpdateAppointmentNotes();
  const { role, currentManagerId } = useAuth();
  const { data: teamMembers = [] } = useTeamMembers();
  const [search, setSearch] = useState("");
  const [repFilter, setRepFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

  const handleSaveNote = (id: string) => {
    updateNotesMutation.mutate({ id, notes: noteInput });
    setEditingNoteId(null);
    setSavedNoteId(id);
    setTimeout(() => setSavedNoteId(null), 1200);
  };

  const teamReps = useMemo(() => {
    if (role === "gestionnaire") {
      return teamMembers.filter((r) => r.role === "representant");
    }
    return teamMembers;
  }, [role, teamMembers]);

  const teamRepIds = useMemo(() => new Set(teamReps.map((r) => r.id)), [teamReps]);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (role === "gestionnaire" && teamRepIds.size > 0 && !teamRepIds.has(a.repId)) return false;
      if (a.isBacklog) return false;
      const matchSearch =
        !search ||
        a.fullName.toLowerCase().includes(search.toLowerCase()) ||
        a.phone.includes(search) ||
        a.address.toLowerCase().includes(search.toLowerCase());
      const matchRep = repFilter === "all" || a.repId === repFilter;
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchRep && matchStatus;
    });
  }, [appointments, search, repFilter, statusFilter, role, teamRepIds]);

  const getRepName = (repId: string) => getRepNameFromList(teamMembers, repId);

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

  const allowedStatuses = role ? STATUS_PERMISSIONS[role] || [] : [];
  const canChangeStatus = role === "proprietaire" || role === "gestionnaire" || role === "representant";

  return (
    <><div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Tous les rendez-vous</h1>
        <Button onClick={() => navigate("/add-appointment")} size="sm">
          <Plus className="h-4 w-4" /> Nouveau rendez-vous
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Rechercher client, téléphone, adresse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={repFilter}
          onChange={(e) => setRepFilter(e.target.value)}
        >
          <option value="all">Tous les représentants</option>
          {teamReps.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tous les statuts</option>
          {APPOINTMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{APPOINTMENT_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Client", "Téléphone", "Adresse", "Date/Heure", "Représentant", "Statut", "Notes"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <button onClick={() => setSelectedAppt(a)} className="text-primary hover:underline text-left">{a.fullName}</button>
                  </td>
                  <td className="px-4 py-3 text-foreground">{a.phone}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      <MapPin className="h-3 w-3" /> Voir carte
                    </a>
                  </td>
                  <td className="px-4 py-3 text-foreground">{a.date} {a.time}</td>
                  <td className="px-4 py-3 text-foreground">{getRepName(a.repId)}</td>
                  <td className="px-4 py-3">
                    {canChangeStatus ? (
                      <select
                        value={a.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as AppointmentStatus;
                          if (allowedStatuses.includes(newStatus)) {
                            updateStatusMutation.mutate({
                              id: a.id,
                              status: newStatus,
                              userId: role || "system",
                              currentStatusLog: a.statusLog || [],
                              previousStatus: a.status,
                            });
                          }
                        }}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[a.status]}`}
                      >
                        {APPOINTMENT_STATUSES.map((s) => (
                          <option key={s} value={s} disabled={!allowedStatuses.includes(s)}>{APPOINTMENT_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                        {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
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
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <CalendarPlus className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-muted-foreground font-medium">Aucun rendez-vous pour le moment</p>
                    <p className="text-muted-foreground text-xs">Commencez par créer votre premier rendez-vous.</p>
                    <Button variant="secondary" size="sm" onClick={() => navigate("/add-appointment")}>
                      Créer un rendez-vous
                    </Button>
                  </div>
                </td></tr>
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

export default AppointmentsPage;
