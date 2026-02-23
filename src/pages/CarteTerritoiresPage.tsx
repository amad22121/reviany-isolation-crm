import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, useMap } from "react-leaflet";
import { useAuth } from "@/store/crm-store";
import { useTerritories, MapZone, TerritoryStatus, TERRITORY_STATUSES } from "@/store/territory-store";
import { SALES_REPS } from "@/data/crm-data";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, X, History, ExternalLink, CalendarDays } from "lucide-react";
import "leaflet/dist/leaflet.css";

const STATUS_COLORS: Record<TerritoryStatus, string> = {
  "À faire": "#9ca3af",
  "Planifié aujourd'hui": "#3b82f6",
  "En cours": "#f97316",
  "Fait": "#22c55e",
};

const STATUS_BADGE: Record<TerritoryStatus, string> = {
  "À faire": "bg-muted text-muted-foreground border-border",
  "Planifié aujourd'hui": "bg-info/20 text-info border-info/30",
  "En cours": "bg-warning/20 text-warning border-warning/30",
  "Fait": "bg-green-500/20 text-green-400 border-green-500/30",
};

const getRepName = (id: string) => SALES_REPS.find((r) => r.id === id)?.name || id;

const FlyToZone = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.flyTo(center, 14, { duration: 0.5 });
  return null;
};

const CarteTerritoiresPage = () => {
  const { role, currentRepId } = useAuth();
  const { mapZones, updateMapZoneStatus, updateMapZone } = useTerritories();
  const isRep = role === "representant";
  const canManage = role === "proprietaire" || role === "gestionnaire";

  const [selectedZone, setSelectedZone] = useState<MapZone | null>(null);
  const [filterToday, setFilterToday] = useState(false);
  const [filterRep, setFilterRep] = useState("all");
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const visibleZones = useMemo(() => {
    return mapZones
      .filter((z) => {
        if (isRep) return z.repId === currentRepId;
        if (filterRep !== "all") return z.repId === filterRep;
        return true;
      })
      .filter((z) => {
        if (filterToday) return z.plannedDate === today;
        return true;
      });
  }, [mapZones, isRep, currentRepId, filterRep, filterToday, today]);

  const handleZoneClick = (zone: MapZone) => {
    setSelectedZone(zone);
    setEditingNotes(false);
    const center = getPolygonCenter(zone.polygon);
    setFlyTarget(center);
  };

  const handleStatusChange = (status: TerritoryStatus) => {
    if (!selectedZone) return;
    if (isRep && selectedZone.repId !== currentRepId) return;
    updateMapZoneStatus(selectedZone.id, status, role || "system");
    setSelectedZone({ ...selectedZone, status });
  };

  const handleRepChange = (repId: string) => {
    if (!selectedZone || !canManage) return;
    updateMapZone(selectedZone.id, { repId });
    setSelectedZone({ ...selectedZone, repId });
  };

  const handleSaveNotes = () => {
    if (!selectedZone) return;
    updateMapZone(selectedZone.id, { notes: notesInput });
    setSelectedZone({ ...selectedZone, notes: notesInput });
    setEditingNotes(false);
  };

  const openGoogleMaps = (zone: MapZone) => {
    const center = getPolygonCenter(zone.polygon);
    window.open(`https://www.google.com/maps/search/?api=1&query=${center[0]},${center[1]}`, "_blank");
  };

  const getPolygonCenter = (polygon: [number, number][]): [number, number] => {
    const lat = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
    const lng = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
    return [lat, lng];
  };

  // Refresh selectedZone from store
  const liveZone = selectedZone ? mapZones.find((z) => z.id === selectedZone.id) || selectedZone : null;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <Button
          variant={filterToday ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterToday(!filterToday)}
        >
          <CalendarDays className="h-4 w-4 mr-1" /> Aujourd'hui
        </Button>

        {!isRep && (
          <Select value={filterRep} onValueChange={setFilterRep}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Représentant" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les reps</SelectItem>
              {SALES_REPS.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto text-xs">
          {TERRITORY_STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s] }} />
              <span className="text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Panel */}
      <div className="flex-1 flex gap-0 rounded-lg overflow-hidden border border-border relative">
        {/* Map */}
        <div className={`flex-1 relative ${liveZone ? "sm:mr-[340px]" : ""}`}>
          <MapContainer
            center={[45.5200, -73.5800]}
            zoom={12}
            className="h-full w-full"
            style={{ background: "hsl(220 20% 10%)" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {visibleZones.map((zone) => (
              <Polygon
                key={zone.id}
                positions={zone.polygon}
                pathOptions={{
                  color: STATUS_COLORS[zone.status],
                  fillColor: STATUS_COLORS[zone.status],
                  fillOpacity: zone.id === liveZone?.id ? 0.5 : 0.25,
                  weight: zone.id === liveZone?.id ? 3 : 2,
                }}
                eventHandlers={{ click: () => handleZoneClick(zone) }}
              />
            ))}
            {flyTarget && <FlyToZone center={flyTarget} />}
          </MapContainer>
        </div>

        {/* Side panel */}
        {liveZone && (
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[340px] bg-card border-l border-border overflow-y-auto z-[1000]">
            <div className="p-4 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{liveZone.name}</h3>
                <button onClick={() => { setSelectedZone(null); setFlyTarget(null); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${STATUS_BADGE[liveZone.status]}`}>
                {liveZone.status}
              </span>

              {/* Info */}
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground text-xs">Ville</span>
                  <p className="text-foreground">{liveZone.city}</p>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground text-xs">Représentant</span>
                  {canManage ? (
                    <Select value={liveZone.repId} onValueChange={handleRepChange}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{SALES_REPS.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <p className="text-foreground">{getRepName(liveZone.repId)}</p>
                  )}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground text-xs">Date planifiée</span>
                  <p className="text-foreground">{liveZone.plannedDate || "—"}</p>
                </div>
              </div>

              {/* Status change */}
              <div>
                <span className="text-muted-foreground text-xs">Modifier le statut</span>
                <Select value={liveZone.status} onValueChange={(v) => handleStatusChange(v as TerritoryStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TERRITORY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground text-xs">Notes terrain</span>
                  {editingNotes ? (
                    <button onClick={handleSaveNotes} className="text-xs text-primary hover:opacity-80">Sauvegarder</button>
                  ) : (
                    <button onClick={() => { setNotesInput(liveZone.notes); setEditingNotes(true); }} className="text-xs text-muted-foreground hover:text-primary">Modifier</button>
                  )}
                </div>
                {editingNotes ? (
                  <Textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)} rows={3} className="bg-secondary/50" autoFocus />
                ) : (
                  <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3">{liveZone.notes || <span className="text-muted-foreground italic">Aucune note</span>}</p>
                )}
              </div>

              {/* Google Maps */}
              <Button variant="outline" size="sm" className="w-full" onClick={() => openGoogleMaps(liveZone)}>
                <ExternalLink className="h-4 w-4 mr-2" /> Ouvrir dans Google Maps
              </Button>

              {/* History */}
              {liveZone.statusLog.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" /> Historique
                  </h4>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {[...liveZone.statusLog].reverse().map((log, i) => (
                      <div key={i} className="bg-secondary/50 rounded-lg p-2.5 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>{log.date} {log.time}</span>
                          <span>par {log.userId}</span>
                        </div>
                        <p className="text-foreground mt-0.5">{log.previousValue} → {log.newValue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarteTerritoiresPage;
