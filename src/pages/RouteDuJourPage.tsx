import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useCrm, useAuth } from "@/store/crm-store";
import { Appointment } from "@/data/crm-data";
import { useTeamMembers, getRepNameFromList } from "@/hooks/useTeamMembers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, MapPin, Phone, User, Navigation, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import FicheClient from "@/components/FicheClient";

const statusColors: Record<string, string> = {
  "En attente": "bg-warning/20 text-warning border-warning/30",
  "Confirmé": "bg-green-500/20 text-green-400 border-green-500/30",
  "À risque": "bg-destructive/20 text-destructive border-destructive/30",
  "Closed": "bg-info/20 text-info border-info/30",
  "Annulé": "bg-muted text-muted-foreground border-border",
};

const RouteDuJourPage = () => {
  const { appointments } = useCrm();
  const { role, currentRepId } = useAuth();
  const isRep = role === "representant";

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRepId, setSelectedRepId] = useState<string>(isRep ? (currentRepId || "") : "all");
  const [ficheAppt, setFicheAppt] = useState<Appointment | null>(null);
  const [ficheOpen, setFicheOpen] = useState(false);
  const { data: teamMembers = [] } = useTeamMembers();

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const filtered = appointments
    .filter((a) => a.date === dateStr && a.status !== "Backlog")
    .filter((a) => {
      if (isRep) return a.repId === currentRepId;
      if (selectedRepId === "all") return true;
      return a.repId === selectedRepId;
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  const confirmed = filtered.filter((a) => a.status === "Confirmé").length;
  const atRisk = filtered.filter((a) => a.status === "À risque").length;
  const closed = filtered.filter((a) => a.status === "Closé").length;

  const openGoogleMaps = (address: string, city: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}`)}`, "_blank");
  };

  const generateItinerary = () => {
    const stops = filtered.slice(0, 10).map((a) => `${a.address}, ${a.city}`);
    if (stops.length === 0) return;
    const origin = encodeURIComponent(stops[0]);
    const destination = encodeURIComponent(stops[stops.length - 1]);
    const waypoints = stops.slice(1, -1).map(encodeURIComponent).join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}`;
    window.open(url, "_blank");
  };

  const getRepName = (id: string) => getRepNameFromList(teamMembers, id);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal min-w-[200px]", !selectedDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP", { locale: fr })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <Button variant="secondary" size="sm" onClick={() => setSelectedDate(new Date())}>
          Aujourd'hui
        </Button>

        {!isRep && (
          <Select value={selectedRepId} onValueChange={setSelectedRepId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Représentant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les reps</SelectItem>
              {teamMembers.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filtered.length > 1 && (
          <Button variant="outline" size="sm" onClick={generateItinerary} className="ml-auto">
            <Navigation className="h-4 w-4 mr-2" />
            Générer itinéraire
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total RDV", value: filtered.length, color: "text-foreground" },
          { label: "Confirmés", value: confirmed, color: "text-green-400" },
          { label: "À risque", value: atRisk, color: "text-destructive" },
          { label: "Closed", value: closed, color: "text-info" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Appointment list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          Aucun rendez-vous pour cette date.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => (
            <div key={appt.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Time + Status */}
              <div className="flex items-center gap-3 sm:w-[140px] shrink-0">
                <span className="text-lg font-bold text-foreground w-14">{appt.time}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusColors[appt.status] || ""}`}>
                  {appt.status}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground truncate">{appt.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{appt.address}, {appt.city}</p>
                {!isRep && selectedRepId === "all" && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> {getRepName(appt.repId)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openGoogleMaps(appt.address, appt.city)} title="Google Maps">
                  <MapPin className="h-4 w-4 text-primary" />
                </Button>
                <a href={`tel:${appt.phone.replace(/[^\d+]/g, "")}`}>
                  <Button variant="ghost" size="icon" className="h-9 w-9" title="Appeler">
                    <Phone className="h-4 w-4 text-primary" />
                  </Button>
                </a>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setFicheAppt(appt); setFicheOpen(true); }} title="Voir fiche">
                  <Eye className="h-4 w-4 text-primary" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FicheClient appointment={ficheAppt} open={ficheOpen} onOpenChange={setFicheOpen} />
    </div>
  );
};

export default RouteDuJourPage;
