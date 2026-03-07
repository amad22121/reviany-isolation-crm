import { Appointment, AppointmentStatus, APPOINTMENT_STATUS_LABELS } from "@/data/crm-data";
import { useTeamMembers, getRepNameFromList } from "@/hooks/useTeamMembers";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin, Phone, Eye, MoreVertical, Check, XCircle, CalendarClock, Lock } from "lucide-react";
import { AppRole } from "@/store/crm-store";
import { useRef, useMemo } from "react";

const STATUS_COLORS: Record<string, string> = {
  [AppointmentStatus.PLANNED]: "bg-warning/20 border-warning/40 text-warning",
  [AppointmentStatus.CONFIRMED]: "bg-green-500/20 border-green-500/40 text-green-300",
  [AppointmentStatus.UNCONFIRMED]: "bg-orange-300/20 border-orange-300/40 text-orange-300",
  [AppointmentStatus.AT_RISK]: "bg-orange-400/20 border-orange-400/40 text-orange-300",
  [AppointmentStatus.POSTPONED]: "bg-blue-400/20 border-blue-400/40 text-blue-300",
  [AppointmentStatus.CANCELLED_CALLBACK]: "bg-amber-500/20 border-amber-500/40 text-amber-400",
  [AppointmentStatus.CANCELLED_FINAL]: "bg-muted/40 border-muted-foreground/30 text-muted-foreground",
  [AppointmentStatus.NO_SHOW]: "bg-red-400/20 border-red-400/40 text-red-300",
  [AppointmentStatus.CLOSED]: "bg-info/20 border-info/40 text-info",
};

const HOUR_HEIGHT = 72; // px per hour
const START_HOUR = 7;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

interface DailyViewProps {
  appointments: Appointment[];
  role: AppRole;
  currentRepId: string | null;
  onOpenFiche: (appt: Appointment) => void;
  onUpdateStatus: (id: string, status: AppointmentStatus) => void;
}

const DailyView = ({ appointments, role, currentRepId, onOpenFiche, onUpdateStatus }: DailyViewProps) => {
  const { data: teamMembers = [] } = useTeamMembers();
  const getRepName = (id: string) => getRepNameFromList(teamMembers, id);
  const isRep = role === "representant";
  const containerRef = useRef<HTMLDivElement>(null);

  const canChangeStatus = (appt: Appointment) => {
    if (role === "proprietaire" || role === "gestionnaire") return true;
    return appt.repId === currentRepId;
  };

  const openGoogleMaps = (address: string, city: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}`)}`, "_blank");
  };

  // Group overlapping appointments into columns
  const positionedAppts = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => a.time.localeCompare(b.time));
    const result: { appt: Appointment; top: number; height: number; col: number; totalCols: number }[] = [];
    const columns: { end: number; idx: number }[][] = [];

    sorted.forEach((appt) => {
      const startMin = timeToMinutes(appt.time);
      const duration = 60; // default 1h block
      const endMin = startMin + duration;
      const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
      const height = (duration / 60) * HOUR_HEIGHT;

      // Find a column where this doesn't overlap
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        if (col.every((item) => result[item.idx].appt.time !== appt.time || timeToMinutes(result[item.idx].appt.time) + 60 <= startMin)) {
          const canFit = col.every((item) => {
            const itemStart = timeToMinutes(result[item.idx].appt.time);
            const itemEnd = itemStart + 60;
            return endMin <= itemStart || startMin >= itemEnd;
          });
          if (canFit) {
            const idx = result.length;
            result.push({ appt, top, height, col: c, totalCols: columns.length });
            col.push({ end: endMin, idx });
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        const idx = result.length;
        const c = columns.length;
        columns.push([{ end: endMin, idx }]);
        result.push({ appt, top, height, col: c, totalCols: columns.length });
      }
    });

    // Update totalCols for all items
    const totalCols = columns.length || 1;
    result.forEach((r) => (r.totalCols = totalCols));

    return result;
  }, [appointments]);

  if (appointments.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-muted-foreground">
        Aucun rendez-vous pour cette date.
      </div>
    );
  }

  const gridHeight = HOURS.length * HOUR_HEIGHT;

  return (
    <div className="bg-card/50 rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <div ref={containerRef} className="relative flex min-w-[600px]" style={{ height: gridHeight }}>
          {/* Hour labels */}
          <div className="w-16 shrink-0 border-r border-border relative">
            {HOURS.map((hour, i) => (
              <div
                key={hour}
                className="absolute left-0 w-full pr-2 text-right text-xs text-muted-foreground"
                style={{ top: i * HOUR_HEIGHT - 8 }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Grid + Events */}
          <div className="flex-1 relative">
            {/* Hour lines */}
            {HOURS.map((hour, i) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-border/50"
                style={{ top: i * HOUR_HEIGHT }}
              />
            ))}
            {/* Half-hour lines */}
            {HOURS.map((hour, i) => (
              <div
                key={`half-${hour}`}
                className="absolute left-0 right-0 border-t border-border/20"
                style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
              />
            ))}

            {/* Now indicator */}
            {(() => {
              const now = new Date();
              const nowMin = now.getHours() * 60 + now.getMinutes();
              if (nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60) {
                const top = ((nowMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                return (
                  <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
                    <div className="h-0.5 bg-destructive/70 relative">
                      <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-destructive" />
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Appointment blocks */}
            {positionedAppts.map(({ appt, top, height, col, totalCols }) => {
              const colWidth = 100 / totalCols;
              const left = col * colWidth;
              const colorClass = STATUS_COLORS[appt.status] || "bg-card border-border text-foreground";

              return (
                <div
                  key={appt.id}
                  className={`absolute rounded-lg border px-2 py-1.5 overflow-hidden cursor-pointer transition-shadow hover:shadow-lg z-10 ${colorClass}`}
                  style={{
                    top: top + 1,
                    height: height - 2,
                    left: `calc(${left}% + 4px)`,
                    width: `calc(${colWidth}% - 8px)`,
                  }}
                  onClick={() => onOpenFiche(appt)}
                >
                  <div className="flex items-start justify-between gap-1 h-full">
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="text-xs font-bold truncate">{appt.time} — {appt.fullName}</p>
                      <p className="text-[10px] opacity-80 truncate">{appt.address}, {appt.city}</p>
                      {!isRep && (
                        <p className="text-[10px] opacity-60 truncate">{getRepName(appt.repId)}</p>
                      )}
                    </div>

                    {/* Quick actions - stop propagation */}
                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="p-1 rounded hover:bg-black/20 transition-colors"
                        onClick={() => openGoogleMaps(appt.address, appt.city)}
                        title="Google Maps"
                      >
                        <MapPin className="h-3 w-3" />
                      </button>
                      <a href={`tel:${appt.phone.replace(/[^\d+]/g, "")}`}>
                        <button className="p-1 rounded hover:bg-black/20 transition-colors" title="Appeler">
                          <Phone className="h-3 w-3" />
                        </button>
                      </a>

                      {canChangeStatus(appt) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-black/20 transition-colors" title="Actions">
                              <MoreVertical className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => onOpenFiche(appt)}>
                              <Eye className="h-3.5 w-3.5 mr-2" /> Fiche client
                            </DropdownMenuItem>
                            {appt.status !== AppointmentStatus.CONFIRMED && (
                              <DropdownMenuItem onClick={() => onUpdateStatus(appt.id, AppointmentStatus.CONFIRMED)}>
                                <Check className="h-3.5 w-3.5 mr-2 text-green-400" /> Confirmer
                              </DropdownMenuItem>
                            )}
                            {appt.status !== AppointmentStatus.CLOSED && (role === "proprietaire" || role === "gestionnaire") && (
                              <DropdownMenuItem onClick={() => onUpdateStatus(appt.id, AppointmentStatus.CLOSED)}>
                                <Lock className="h-3.5 w-3.5 mr-2 text-info" /> {APPOINTMENT_STATUS_LABELS[AppointmentStatus.CLOSED]}
                              </DropdownMenuItem>
                            )}
                            {appt.status !== AppointmentStatus.PLANNED && (
                              <DropdownMenuItem onClick={() => onUpdateStatus(appt.id, AppointmentStatus.PLANNED)}>
                                <CalendarClock className="h-3.5 w-3.5 mr-2 text-warning" /> Replanifier
                              </DropdownMenuItem>
                            )}
                            {appt.status !== AppointmentStatus.CANCELLED_CALLBACK && (role === "proprietaire" || role === "gestionnaire") && (
                              <DropdownMenuItem onClick={() => onUpdateStatus(appt.id, AppointmentStatus.CANCELLED_CALLBACK)}>
                                <XCircle className="h-3.5 w-3.5 mr-2 text-amber-400" /> {APPOINTMENT_STATUS_LABELS[AppointmentStatus.CANCELLED_CALLBACK]}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyView;
