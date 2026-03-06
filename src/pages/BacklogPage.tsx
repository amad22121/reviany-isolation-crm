import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { useTeamMembers, getRepNameFromList } from "@/hooks/useTeamMembers";
import { useNavigate } from "react-router-dom";
import { Phone, Search, Archive, ArrowRight, Trash2 } from "lucide-react";

const BacklogPage = () => {
  const { appointments, deleteAppointment } = useCrm();
  const { role, currentRepId } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const backlogItems = useMemo(() => {
    let items = appointments.filter((a) => a.status === "Backlog");
    if (role === "representant") items = items.filter((a) => a.repId === currentRepId);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (a) =>
          a.fullName.toLowerCase().includes(q) ||
          a.phone.includes(q) ||
          a.city.toLowerCase().includes(q)
      );
    }
    return items;
  }, [appointments, role, currentRepId, search]);

  const { data: teamMembers = [] } = useTeamMembers();
  const getRepName = (repId: string) => getRepNameFromList(teamMembers, repId);
  const canDelete = role === "proprietaire" || role === "gestionnaire";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Archive className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Backlog</h1>
        <span className="text-sm text-muted-foreground ml-2">({backlogItems.length})</span>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Client", "Téléphone", "Adresse", "Ville", "Rep", "Notes", "Actions"].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-muted-foreground font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {backlogItems.map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-3 py-3 font-medium text-foreground whitespace-nowrap">{a.fullName}</td>
                  <td className="px-3 py-3">
                    <a href={`tel:${a.phone.replace(/\D/g, "")}`} className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap">
                      <Phone className="h-3 w-3" /> {a.phone}
                    </a>
                  </td>
                  <td className="px-3 py-3 text-foreground text-xs max-w-[160px] truncate" title={a.address}>{a.address}</td>
                  <td className="px-3 py-3 text-foreground text-xs">{a.city}</td>
                  <td className="px-3 py-3 text-foreground text-xs">{getRepName(a.repId)}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{a.notes || "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/add-appointment?backlog=${a.id}`)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        <ArrowRight className="h-3 w-3" /> Convertir
                      </button>
                      {canDelete && (
                        deleteConfirm === a.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => { deleteAppointment(a.id); setDeleteConfirm(null); }} className="text-xs text-destructive font-medium">Oui</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground">Non</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(a.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {backlogItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Aucun élément dans le backlog</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BacklogPage;
