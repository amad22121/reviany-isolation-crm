import { Appointment, SALES_REPS } from "@/data/crm-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Calendar, Clock, User, FileText, HelpCircle, StickyNote } from "lucide-react";

const statusColors: Record<string, string> = {
  "En attente": "bg-warning/20 text-warning border-warning/30",
  "Confirmé": "bg-primary/20 text-primary border-primary/30",
  "Absence": "bg-destructive/20 text-destructive border-destructive/30",
  "Fermé": "bg-info/20 text-info border-info/30",
  "Annulé": "bg-muted text-muted-foreground border-border",
};

interface FicheClientProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FicheClient = ({ appointment, open, onOpenChange }: FicheClientProps) => {
  if (!appointment) return null;

  const rep = SALES_REPS.find((r) => r.id === appointment.repId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Fiche Client
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Client name & status */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {appointment.clientFirstName} {appointment.clientLastName}
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[appointment.status]}`}>
              {appointment.status}
            </span>
          </div>

          {/* Informations principales */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Informations principales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground">{appointment.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground">{appointment.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground">{appointment.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground">{rep?.name || "—"}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm pt-1">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {appointment.address}
              </a>
            </div>
          </div>

          {/* Préqualification */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <HelpCircle className="h-4 w-4" /> Questions de préqualification
            </h3>
            <div className="space-y-2">
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Êtes-vous propriétaire ?</p>
                <p className="text-sm text-foreground">{appointment.preQual1 || "—"}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Quel est votre besoin principal ?</p>
                <p className="text-sm text-foreground">{appointment.preQual2 || "—"}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <StickyNote className="h-4 w-4" /> Notes
            </h3>
            <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3">
              {appointment.notes || "Aucune note."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FicheClient;
