import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS, Appointment } from "@/data/crm-data";
import FicheClient from "@/components/FicheClient";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Target, Plus, MapPin, Bell } from "lucide-react";

const RepViewPage = () => {
  const { appointments, dailyTarget } = useCrm();
  const { currentRepId } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const rep = SALES_REPS.find((r) => r.id === currentRepId);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  
  const DAILY_GOAL = Math.ceil(dailyTarget / SALES_REPS.length);

  const todayAppts = useMemo(
    () => appointments.filter((a) => a.repId === currentRepId && a.date === today),
    [appointments, currentRepId, today]
  );

  const statusColors: Record<string, string> = {
    "En attente": "bg-warning/20 text-warning",
    "Confirmé": "bg-primary/20 text-primary",
    "Absence": "bg-destructive/20 text-destructive",
    "Fermé": "bg-info/20 text-info",
    "Annulé": "bg-muted text-muted-foreground",
  };

  return (
    <><div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Bienvenue, {rep?.name}</h1>
        <button
          onClick={() => navigate("/add-appointment")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Nouveau rendez-vous
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Rendez-vous aujourd'hui</span>
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{todayAppts.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Objectif du jour</span>
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{todayAppts.length}/{DAILY_GOAL}</div>
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (todayAppts.length / DAILY_GOAL) * 100)}%` }}
            />
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
                    <button onClick={() => setSelectedAppt(a)} className="text-primary hover:underline text-left">{a.clientFirstName} {a.clientLastName}</button>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">
                    {a.notes}
                    {a.smsScheduled && <Bell className="inline h-3 w-3 ml-1 text-primary" />}
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
