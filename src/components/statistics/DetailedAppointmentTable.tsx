import { useState } from "react";
import { Appointment, SALES_REPS } from "@/data/crm-data";
import { ChevronDown, ChevronUp } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  "Confirmé": "bg-green-500/20 text-green-400",
  "En attente": "bg-warning/20 text-warning",
  "À risque": "bg-orange-400/20 text-orange-400",
  "Closed": "bg-info/20 text-info",
  "Annulé": "bg-muted text-muted-foreground",
};

interface Props {
  appointments: Appointment[];
}

const DetailedAppointmentTable = ({ appointments }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const getRepName = (id: string) => SALES_REPS.find((r) => r.id === id)?.name || id;

  const visible = expanded ? appointments : appointments.slice(0, 10);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 border-b border-border/50 flex items-center justify-between hover:bg-secondary/20 transition-colors"
      >
        <h3 className="text-sm font-semibold text-foreground">Détail des rendez-vous ({appointments.length})</h3>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {(expanded || appointments.length <= 10) && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Client</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Téléphone</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Heure</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Statut</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Rep</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Source</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{a.fullName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.phone}</td>
                  <td className="px-3 py-2.5 text-foreground">{a.date}</td>
                  <td className="px-3 py-2.5 text-foreground">{a.time}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE[a.status] || "bg-secondary text-secondary-foreground"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{getRepName(a.repId)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.source || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!expanded && appointments.length > 10 && (
        <button onClick={() => setExpanded(true)} className="w-full p-3 text-xs text-primary hover:underline">
          Voir les {appointments.length - 10} autres
        </button>
      )}
    </div>
  );
};

export default DetailedAppointmentTable;
