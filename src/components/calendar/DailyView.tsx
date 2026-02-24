import { Appointment, AppointmentStatus, SALES_REPS, APPOINTMENT_STATUSES } from "@/data/crm-data";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin, Phone, Eye, MoreVertical, Check, XCircle, CalendarClock, Lock } from "lucide-react";
import { AppRole } from "@/store/crm-store";

const STATUS_COLORS: Record<string, string> = {
  "Confirmé": "border-l-green-500 bg-green-500/10",
  "En attente": "border-l-warning bg-warning/10",
  "À risque": "border-l-orange-400 bg-orange-400/10",
  "Closed": "border-l-info bg-info/10",
  "Annulé": "border-l-muted-foreground bg-muted/30",
};

const STATUS_BADGE: Record<string, string> = {
  "Confirmé": "bg-green-500/20 text-green-400",
  "En attente": "bg-warning/20 text-warning",
  "À risque": "bg-orange-400/20 text-orange-400",
  "Closed": "bg-info/20 text-info",
  "Annulé": "bg-muted text-muted-foreground",
};

interface DailyViewProps {
  appointments: Appointment[];
  role: AppRole;
  currentRepId: string | null;
  onOpenFiche: (appt: Appointment) => void;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
}

const getRepName = (id: string) => SALES_REPS.find((r) => r.id === id)?.name || id;

const DailyView = ({ appointments, role, currentRepId, onOpenFiche, onUpdateStatus }: DailyViewProps) => {
  const isRep = role === "representant";

  const canChangeStatus = (appt: Appointment) => {
    if (role === "proprietaire" || role === "gestionnaire") return true;
    return appt.repId === currentRepId;
  };

  const openGoogleMaps = (address: string, city: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}`)}`, "_blank");
  };

  if (appointments.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-muted-foreground">
        Aucun rendez-vous pour cette date.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((appt) => (
        <div
          key={appt.id}
          className={`border-l-4 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${STATUS_COLORS[appt.status] || "border-l-muted bg-card/50"}`}
        >
          {/* Time + Status */}
          <div className="flex items-center gap-3 sm:w-[130px] shrink-0">
            <span className="text-lg font-bold text-foreground w-14">{appt.time}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[appt.status] || "bg-secondary text-secondary-foreground"}`}>
              {appt.status}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-foreground truncate">{appt.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{appt.address}, {appt.city}</p>
            {!isRep && (
              <p className="text-[11px] text-muted-foreground">{getRepName(appt.repId)}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openGoogleMaps(appt.address, appt.city)} title="Google Maps">
              <MapPin className="h-4 w-4 text-primary" />
            </Button>
            <a href={`tel:${appt.phone.replace(/[^\d+]/g, "")}`}>
              <Button variant="ghost" size="icon" className="h-9 w-9" title="Appeler">
                <Phone className="h-4 w-4 text-primary" />
              </Button>
            </a>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onOpenFiche(appt)} title="Fiche client">
              <Eye className="h-4 w-4 text-primary" />
            </Button>

            {/* Quick actions dropdown */}
            {canChangeStatus(appt) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" title="Actions">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {appt.status !== "Confirmé" && (
                    <DropdownMenuItem onClick={() => onUpdateStatus(appt.id, "Confirmé")}>
                      <Check className="h-3.5 w-3.5 mr-2 text-green-400" /> Confirmer
                    </DropdownMenuItem>
                  )}
                  {appt.status !== "Closed" && (role === "proprietaire" || role === "gestionnaire") && (
                    <DropdownMenuItem onClick={() => onUpdateStatus(appt.id, "Closed")}>
                      <Lock className="h-3.5 w-3.5 mr-2 text-info" /> Closed
                    </DropdownMenuItem>
                  )}
                  {appt.status !== "En attente" && (
                    <DropdownMenuItem onClick={() => onUpdateStatus(appt.id, "En attente")}>
                      <CalendarClock className="h-3.5 w-3.5 mr-2 text-warning" /> Replanifier
                    </DropdownMenuItem>
                  )}
                  {appt.status !== "Annulé" && (role === "proprietaire" || role === "gestionnaire") && (
                    <DropdownMenuItem onClick={() => onUpdateStatus(appt.id, "Annulé")}>
                      <XCircle className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Annuler
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DailyView;
