import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Phone,
  MapPin,
  CheckCircle,
  CalendarPlus,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { AtRiskAppointment } from "@/lib/atRiskLogic";
import { useCrm } from "@/store/crm-store";

interface Props {
  appointments: AtRiskAppointment[];
  canManage: boolean;
}

const statusColors: Record<string, string> = {
  "Non confirmé": "bg-warning/20 text-warning",
  unconfirmed: "bg-warning/20 text-warning",
  "À risque": "bg-destructive/20 text-destructive",
  at_risk: "bg-destructive/20 text-destructive",
};

const statusLabels: Record<string, string> = {
  "Non confirmé": "Non confirmé",
  unconfirmed: "Non confirmé",
  "À risque": "À risque",
  at_risk: "À risque",
};

export default function AtRiskAppointmentsSection({ appointments, canManage }: Props) {
  const updateStatus = useCrm((s) => s.updateStatus);

  // Reschedule modal
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("09:00");

  // Cancel modal
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelAction, setCancelAction] = useState<"cancelled_callback" | "no_show">("cancelled_callback");

  const handleConfirm = (id: string) => {
    updateStatus(id, "Confirmé" as any);
    toast.success("RDV marqué comme confirmé");
  };

  const handleReschedule = () => {
    if (!rescheduleId || !rescheduleDate) return;
    // Placeholder: in production this would update the appointment date/time
    toast.success("RDV replanifié (placeholder — le backend n'est pas encore connecté)");
    setRescheduleId(null);
  };

  const handleCancel = () => {
    if (!cancelId) return;
    const statusMap: Record<string, string> = {
      cancelled_callback: "Annulé (à rappeler)",
      no_show: "No-show",
    };
    updateStatus(cancelId, statusMap[cancelAction] as any);
    toast.info("RDV annulé. Ce client devrait apparaître dans les Hot Calls après la connexion backend.");
    setCancelId(null);
  };

  const openGoogleMaps = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  if (appointments.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <CheckCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Aucun RDV à risque pour cette période.</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Nom", "Téléphone", "Adresse", "Date / Heure", "Statut", "Actions"].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-muted-foreground font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-3 py-3 font-medium whitespace-nowrap text-foreground">{a.full_name}</td>
                  <td className="px-3 py-3">
                    <a
                      href={`tel:${a.phone.replace(/\D/g, "")}`}
                      className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap"
                    >
                      <Phone className="h-3 w-3" /> {a.phone}
                    </a>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => openGoogleMaps(a.address, a.city)}
                      className="flex items-center gap-1 text-info hover:underline text-left text-xs max-w-[200px] truncate"
                      title={`${a.address}, ${a.city}`}
                    >
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{a.address}</span>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">
                    {a.date} à {a.time || "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status] || "bg-muted text-muted-foreground"}`}>
                      {statusLabels[a.status] || a.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {/* Appeler */}
                      <a
                        href={`tel:${a.phone.replace(/\D/g, "")}`}
                        className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                        title="Appeler"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>

                      {/* Marquer confirmé */}
                      <button
                        onClick={() => handleConfirm(a.id)}
                        className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                        title="Marquer confirmé"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>

                      {/* Replanifier */}
                      <button
                        onClick={() => { setRescheduleId(a.id); setRescheduleDate(a.date); setRescheduleTime(a.time || "09:00"); }}
                        className="p-1.5 rounded hover:bg-info/20 text-muted-foreground hover:text-info transition-colors"
                        title="Replanifier"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                      </button>

                      {/* Annuler / No-show */}
                      {canManage && (
                        <button
                          onClick={() => { setCancelId(a.id); setCancelAction("cancelled_callback"); }}
                          className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          title="Annuler / No-show"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal */}
      <Dialog open={!!rescheduleId} onOpenChange={(o) => { if (!o) setRescheduleId(null); }}>
        <DialogContent className="sm:max-w-[350px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Replanifier le RDV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nouvelle date</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Heure</label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleReschedule} className="flex-1" disabled={!rescheduleDate}>Replanifier</Button>
              <Button variant="outline" onClick={() => setRescheduleId(null)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel / No-show Modal */}
      <Dialog open={!!cancelId} onOpenChange={(o) => { if (!o) setCancelId(null); }}>
        <DialogContent className="sm:max-w-[350px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Annuler le rendez-vous</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Action</label>
              <select
                value={cancelAction}
                onChange={(e) => setCancelAction(e.target.value as any)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="cancelled_callback">Annulé (à rappeler)</option>
                <option value="no_show">No-show</option>
              </select>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Ce RDV sera automatiquement créé comme Hot Call une fois le backend connecté.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="destructive" onClick={handleCancel} className="flex-1">Confirmer</Button>
              <Button variant="outline" onClick={() => setCancelId(null)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
