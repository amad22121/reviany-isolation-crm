import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { Appointment, AppointmentStatus, APPOINTMENT_STATUS_LABELS } from "@/data/crm-data";
import { useAppointments } from "@/hooks/useAppointments";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import FicheClient from "@/components/FicheClient";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Target, Plus, MapPin, Users, Trophy } from "lucide-react";

const RepViewPage = () => {
  const { dailyTarget, repGoals } = useCrm();
  const { data: appointments = [] } = useAppointments();
  const { currentRepId } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const { data: teamMembers = [] } = useTeamMembers();
  const rep = teamMembers.find((r) => r.id === currentRepId);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const myGoal = repGoals[currentRepId || ""] || 0;

  const todayAppts = useMemo(
    () => appointments.filter((a) => a.repId === currentRepId && a.date === today && !a.isBacklog),
    [appointments, currentRepId, today]
  );

  const startOfWeek = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().split("T")[0];
  }, []);

  const teamTodayAppts = useMemo(
    () => appointments.filter((a) => a.date === today),
    [appointments, today]
  );

  const weekAppts = useMemo(
    () => appointments.filter((a) => a.repId === currentRepId && a.date >= startOfWeek && a.date <= today),
    [appointments, currentRepId, startOfWeek, today]
  );

  const weekConfirmed = useMemo(
    () => weekAppts.filter((a) => a.status === AppointmentStatus.CONFIRMED),
    [weekAppts]
  );

  const myProgress = todayAppts.length;
  const teamProgress = teamTodayAppts.length;
  const myPct = myGoal > 0 ? Math.min(100, (myProgress / myGoal) * 100) : 0;
  const teamPct = dailyTarget > 0 ? Math.min(100, (teamProgress / dailyTarget) * 100) : 0;

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

  return (
    <><div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Bienvenue{rep ? `, ${rep.name}` : ""}</h1>
        <button
          onClick={() => navigate("/add-appointment")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Nouveau rendez-vous
        </button>
      </div>

      {/* Personal + Team Goals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Mon objectif du jour</span>
            </div>
            <span className="text-xs text-muted-foreground">{myGoal > 0 ? `${myGoal} RDV` : "Non défini"}</span>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {myProgress} <span className="text-lg text-muted-foreground">/ {myGoal || "—"}</span>
          </div>
          <div className="mt-3 h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${myPct >= 100 ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${myPct}%` }}
            />
          </div>
          {myPct >= 100 && (
            <p className="text-xs text-green-500 font-medium mt-2">🎉 Objectif atteint !</p>
          )}
        </div>

        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-info/5 rounded-bl-full" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-info" />
              <span className="text-sm font-medium text-foreground">Objectif équipe</span>
            </div>
            <span className="text-xs text-muted-foreground">{dailyTarget} RDV</span>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {teamProgress} <span className="text-lg text-muted-foreground">/ {dailyTarget}</span>
          </div>
          <div className="mt-3 h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${teamPct >= 100 ? "bg-green-500" : "bg-info"}`}
              style={{ width: `${teamPct}%` }}
            />
          </div>
          {teamPct >= 100 && (
            <p className="text-xs text-green-500 font-medium mt-2">🎉 Objectif équipe atteint !</p>
          )}
        </div>
      </div>

      <div className="glass-card p-4">
        <h2 className="text-sm font-medium text-foreground mb-3">Performance semaine</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-secondary/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Mes rendez-vous cette semaine</span>
              <CalendarCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{weekAppts.length}</div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Mes rendez-vous confirmés cette semaine</span>
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{weekConfirmed.length}</div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Horaire du jour</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Heure", "Client", "Téléphone", "Adresse", "Statut", "Notes"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayAppts.sort((a, b) => a.time.localeCompare(b.time)).map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{a.time}</td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>{APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">
                    {a.notes}
                  </td>
                </tr>
              ))}
              {todayAppts.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucun rendez-vous aujourd'hui</td></tr>
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

export default RepViewPage;
