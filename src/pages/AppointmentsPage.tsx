import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS, Appointment } from "@/data/crm-data";
import { Search, MapPin, Bell } from "lucide-react";
import FicheClient from "@/components/FicheClient";

const STATUS_LIST = ["En attente", "Confirmé", "Absence", "Fermé", "Annulé"];

const AppointmentsPage = () => {
  const { appointments, updateStatus } = useCrm();
  const { role, currentManagerId } = useAuth();
  const [search, setSearch] = useState("");
  const [repFilter, setRepFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const teamReps = useMemo(() => {
    if (role === "gestionnaire" && currentManagerId) {
      return SALES_REPS.filter((r) => r.managerId === currentManagerId);
    }
    return SALES_REPS;
  }, [role, currentManagerId]);

  const teamRepIds = useMemo(() => new Set(teamReps.map((r) => r.id)), [teamReps]);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (role === "gestionnaire" && !teamRepIds.has(a.repId)) return false;
      const matchSearch =
        !search ||
        `${a.clientFirstName} ${a.clientLastName}`.toLowerCase().includes(search.toLowerCase()) ||
        a.phone.includes(search) ||
        a.address.toLowerCase().includes(search.toLowerCase());
      const matchRep = repFilter === "all" || a.repId === repFilter;
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchRep && matchStatus;
    });
  }, [appointments, search, repFilter, statusFilter, role, teamRepIds]);

  const getRepName = (repId: string) => SALES_REPS.find((r) => r.id === repId)?.name || repId;

  const statusColors: Record<string, string> = {
    "En attente": "bg-warning/20 text-warning",
    "Confirmé": "bg-primary/20 text-primary",
    "Absence": "bg-destructive/20 text-destructive",
    "Fermé": "bg-info/20 text-info",
    "Annulé": "bg-muted text-muted-foreground",
  };

  return (
    <><div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Tous les rendez-vous</h1>

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
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>{s}</option>
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
                  <td className="px-4 py-3 text-foreground">{a.date} {a.time}</td>
                  <td className="px-4 py-3 text-foreground">{getRepName(a.repId)}</td>
                  <td className="px-4 py-3">
                    {(role === "proprietaire" || role === "gestionnaire") ? (
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value as any)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[a.status]}`}
                      >
                        {STATUS_LIST.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                        {a.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">
                    {a.notes}
                    {a.smsScheduled && (
                      <span className="ml-2 inline-flex items-center gap-1 text-primary">
                        <Bell className="h-3 w-3" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Aucun rendez-vous trouvé</td></tr>
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
