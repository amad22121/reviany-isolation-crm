import { useState, useMemo } from "react";
import { Appointment, SALES_REPS } from "@/data/crm-data";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUS_BADGE: Record<string, string> = {
  "Planifié": "bg-yellow-500/20 text-yellow-400",
  "Confirmé": "bg-green-500/20 text-green-400",
  "Non confirmé": "bg-yellow-600/20 text-yellow-300",
  "À risque": "bg-orange-400/20 text-orange-400",
  "Reporté": "bg-blue-500/20 text-blue-400",
  "Annulé (à rappeler)": "bg-amber-500/20 text-amber-400",
  "Annulé (définitif)": "bg-muted text-muted-foreground",
  "No-show": "bg-red-500/20 text-red-400",
  "Closé": "bg-info/20 text-info",
};

interface Props {
  appointments: Appointment[];
}

const DetailedAppointmentTable = ({ appointments }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const getRepName = (id: string) => SALES_REPS.find((r) => r.id === id)?.name || id;

  const filtered = useMemo(() => {
    if (!search.trim()) return appointments;
    const q = search.toLowerCase();
    return appointments.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        a.address.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        getRepName(a.repId).toLowerCase().includes(q)
    );
  }, [appointments, search]);

  const visible = expanded ? filtered : filtered.slice(0, 10);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 border-b border-border/50 flex items-center justify-between hover:bg-secondary/20 transition-colors"
      >
        <h3 className="text-sm font-semibold text-foreground">Détail des rendez-vous ({filtered.length})</h3>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      <div className="px-4 py-2 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher client, tél, adresse, statut..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {(expanded || filtered.length <= 10) && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Client</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Téléphone</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Adresse</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Heure</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Statut</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Rep</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Source</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{a.fullName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.phone}</td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap max-w-[200px] truncate">{a.address}</td>
                  <td className="px-3 py-2.5 text-foreground">{a.date}</td>
                  <td className="px-3 py-2.5 text-foreground">{a.time}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${STATUS_BADGE[a.status] || "bg-secondary text-secondary-foreground"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{getRepName(a.repId)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.source || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!expanded && filtered.length > 10 && (
        <button onClick={() => setExpanded(true)} className="w-full p-3 text-xs text-primary hover:underline">
          Voir les {filtered.length - 10} autres
        </button>
      )}
    </div>
  );
};

export default DetailedAppointmentTable;
