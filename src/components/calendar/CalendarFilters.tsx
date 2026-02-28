import { SALES_REPS, APPOINTMENT_STATUSES, AppointmentStatus } from "@/data/crm-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_BADGE_COLORS: Record<string, string> = {
  "Planifié": "bg-warning/20 text-warning hover:bg-warning/30",
  "Confirmé": "bg-green-500/20 text-green-400 hover:bg-green-500/30",
  "Non confirmé": "bg-orange-300/20 text-orange-300 hover:bg-orange-300/30",
  "À risque": "bg-orange-400/20 text-orange-400 hover:bg-orange-400/30",
  "Reporté": "bg-blue-400/20 text-blue-400 hover:bg-blue-400/30",
  "Annulé (à rappeler)": "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30",
  "Annulé (définitif)": "bg-muted text-muted-foreground hover:bg-muted/80",
  "No-show": "bg-red-400/20 text-red-400 hover:bg-red-400/30",
  "Closé": "bg-info/20 text-info hover:bg-info/30",
};

interface CalendarFiltersProps {
  isRep: boolean;
  selectedRepId: string;
  onRepChange: (id: string) => void;
  selectedStatuses: AppointmentStatus[];
  onStatusToggle: (status: AppointmentStatus) => void;
  view: "day" | "week" | "month";
  onViewChange: (v: "day" | "week" | "month") => void;
  headerLabel: string;
  onNavigate: (dir: number) => void;
  onToday: () => void;
  onTomorrow: () => void;
  showRouteButton: boolean;
  routeButtonDisabled?: boolean;
  routeButtonLabel?: string;
  onGenerateRoute: () => void;
}

const CalendarFilters = ({
  isRep,
  selectedRepId,
  onRepChange,
  selectedStatuses,
  onStatusToggle,
  view,
  onViewChange,
  headerLabel,
  onNavigate,
  onToday,
  onTomorrow,
  showRouteButton,
  routeButtonDisabled,
  routeButtonLabel,
  onGenerateRoute,
}: CalendarFiltersProps) => {
  const displayStatuses = APPOINTMENT_STATUSES;

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 space-y-3">
      {/* Row 1: Nav + View toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate(-1)} className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={onToday} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm transition-colors">
            Aujourd'hui
          </button>
          <button onClick={onTomorrow} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm transition-colors">
            Demain
          </button>
          <button onClick={() => onNavigate(1)} className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-foreground capitalize ml-2 hidden sm:inline">{headerLabel}</span>
        </div>

        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(["day", "week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                view === v ? "bg-primary text-primary-foreground" : "text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile header label */}
      <p className="text-sm font-medium text-foreground capitalize sm:hidden">{headerLabel}</p>

      {/* Row 2: Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {!isRep && (
          <Select value={selectedRepId} onValueChange={onRepChange}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Représentant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les reps</SelectItem>
              {SALES_REPS.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex flex-wrap gap-1.5">
          {displayStatuses.map((status) => {
            const active = selectedStatuses.includes(status);
            return (
              <button
                key={status}
                onClick={() => onStatusToggle(status)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                  active
                    ? STATUS_BADGE_COLORS[status] || "bg-secondary text-secondary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                } ${active ? "border-transparent" : ""}`}
              >
                {status}
              </button>
            );
          })}
        </div>

        {showRouteButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateRoute}
            disabled={routeButtonDisabled}
            className="ml-auto h-9 text-xs"
            title={routeButtonDisabled ? routeButtonLabel : undefined}
          >
            <Navigation className="h-3.5 w-3.5 mr-1.5" />
            {routeButtonLabel || "Itinéraire Google Maps"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CalendarFilters;
