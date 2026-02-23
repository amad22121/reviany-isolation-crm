import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import L, { Map as LeafletMap, LayerGroup as LeafletLayerGroup, FeatureGroup as LeafletFeatureGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { useAuth } from "@/store/crm-store";
import { TerritoryStatus, TERRITORY_STATUSES } from "@/store/territory-store";
import { SALES_REPS } from "@/data/crm-data";
import { useMapZonesQuery, useZoneLogsQuery, useCreateZone, useUpdateZone, useDeleteZone, DbMapZone } from "@/hooks/useMapZones";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ZoneFormPanel from "@/components/carte/ZoneFormPanel";
import ZoneDetailPanel from "@/components/carte/ZoneDetailPanel";

const STATUS_COLORS: Record<TerritoryStatus, string> = {
  "À faire": "#9ca3af",
  "Planifié aujourd'hui": "#3b82f6",
  "En cours": "#f97316",
  "Fait": "#22c55e",
};

const getPolygonCenter = (polygon: [number, number][]): [number, number] => {
  const lat = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
  const lng = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
  return [lat, lng];
};

const CarteTerritoiresPage = () => {
  const { role, currentRepId } = useAuth();
  const isRep = role === "representant";
  const canManage = role === "proprietaire" || role === "gestionnaire";

  const { data: zones = [], isLoading } = useMapZonesQuery();
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [filterToday, setFilterToday] = useState(false);
  const [filterRep, setFilterRep] = useState("all");

  // Drawing state
  const [drawnPolygon, setDrawnPolygon] = useState<[number, number][] | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const zoneLayerRef = useRef<LeafletLayerGroup | null>(null);
  const drawLayerRef = useRef<LeafletFeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const selectedZone = useMemo(() => zones.find((z) => z.id === selectedZoneId) ?? null, [zones, selectedZoneId]);
  const { data: logs = [] } = useZoneLogsQuery(selectedZoneId);

  const visibleZones = useMemo(() => {
    return zones
      .filter((z) => {
        if (isRep) return z.rep_id === currentRepId;
        if (filterRep !== "all") return z.rep_id === filterRep;
        return true;
      })
      .filter((z) => {
        if (filterToday) return z.planned_date === today;
        return true;
      });
  }, [zones, isRep, currentRepId, filterRep, filterToday, today]);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: true }).setView([45.52, -73.58], 12);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    const zoneLayer = L.layerGroup().addTo(map);
    const drawLayer = new L.FeatureGroup().addTo(map);

    mapRef.current = map;
    zoneLayerRef.current = zoneLayer;
    drawLayerRef.current = drawLayer;

    // Add draw control only for users who can manage
    if (canManage) {
      const drawControl = new L.Control.Draw({
        draw: {
          polygon: {
            allowIntersection: false,
            shapeOptions: { color: "#3b82f6", weight: 2 },
          },
          polyline: false,
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
        },
        edit: { featureGroup: drawLayer, remove: false, edit: false },
      });
      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        const polygon: [number, number][] = latlngs.map((ll) => [ll.lat, ll.lng]);
        drawLayer.addLayer(layer);
        setDrawnPolygon(polygon);
        setShowCreateForm(true);
        setSelectedZoneId(null);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      zoneLayerRef.current = null;
      drawLayerRef.current = null;
      drawControlRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Render zones
  useEffect(() => {
    if (!mapRef.current || !zoneLayerRef.current) return;
    zoneLayerRef.current.clearLayers();

    visibleZones.forEach((zone) => {
      const selected = zone.id === selectedZoneId;
      const polygon = L.polygon(zone.polygon, {
        color: STATUS_COLORS[zone.status],
        fillColor: STATUS_COLORS[zone.status],
        fillOpacity: selected ? 0.5 : 0.25,
        weight: selected ? 3 : 2,
      });

      polygon.on("click", () => {
        setSelectedZoneId(zone.id);
        setShowCreateForm(false);
        setDrawnPolygon(null);
        drawLayerRef.current?.clearLayers();
        const center = getPolygonCenter(zone.polygon);
        mapRef.current?.flyTo(center, 14, { duration: 0.5 });
      });

      polygon.addTo(zoneLayerRef.current!);
    });
  }, [visibleZones, selectedZoneId]);

  const handleCreateZone = useCallback(async (data: {
    name: string;
    city: string;
    status: TerritoryStatus;
    repId: string;
    plannedDate: string;
    notes: string;
  }) => {
    if (!drawnPolygon) return;
    try {
      await createZone.mutateAsync({
        name: data.name,
        city: data.city,
        status: data.status,
        rep_id: data.repId,
        planned_date: data.plannedDate,
        notes: data.notes,
        polygon: drawnPolygon,
        created_by: role || "system",
      });
      toast.success("Zone créée avec succès");
      setShowCreateForm(false);
      setDrawnPolygon(null);
      drawLayerRef.current?.clearLayers();
    } catch {
      toast.error("Erreur lors de la création");
    }
  }, [drawnPolygon, createZone, role]);

  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setDrawnPolygon(null);
    drawLayerRef.current?.clearLayers();
  }, []);

  const handleUpdateStatus = useCallback(async (status: TerritoryStatus) => {
    if (!selectedZone) return;
    if (isRep && selectedZone.rep_id !== currentRepId) return;
    try {
      await updateZone.mutateAsync({
        id: selectedZone.id,
        updates: { status },
        statusChange: { previous: selectedZone.status, next: status, changedBy: role || "system" },
      });
      toast.success("Statut mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }, [selectedZone, isRep, currentRepId, updateZone, role]);

  const handleUpdateRep = useCallback(async (repId: string) => {
    if (!selectedZone || !canManage) return;
    await updateZone.mutateAsync({ id: selectedZone.id, updates: { rep_id: repId } });
  }, [selectedZone, canManage, updateZone]);

  const handleUpdateNotes = useCallback(async (notes: string) => {
    if (!selectedZone) return;
    await updateZone.mutateAsync({ id: selectedZone.id, updates: { notes } });
    toast.success("Notes sauvegardées");
  }, [selectedZone, updateZone]);

  const handleUpdateDate = useCallback(async (date: string) => {
    if (!selectedZone) return;
    await updateZone.mutateAsync({ id: selectedZone.id, updates: { planned_date: date } });
  }, [selectedZone, updateZone]);

  const handleDelete = useCallback(async () => {
    if (!selectedZone || !canManage) return;
    try {
      await deleteZone.mutateAsync(selectedZone.id);
      setSelectedZoneId(null);
      toast.success("Zone supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }, [selectedZone, canManage, deleteZone]);

  const showPanel = showCreateForm || selectedZone;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-4">
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <Button variant={filterToday ? "default" : "outline"} size="sm" onClick={() => setFilterToday(!filterToday)}>
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

        <div className="flex items-center gap-3 ml-auto text-xs">
          {TERRITORY_STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s] }} />
              <span className="text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-0 rounded-lg overflow-hidden border border-border relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[1001]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className={`flex-1 relative ${showPanel ? "sm:mr-[340px]" : ""}`}>
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        {showCreateForm && drawnPolygon && (
          <ZoneFormPanel onSubmit={handleCreateZone} onCancel={handleCancelCreate} />
        )}

        {selectedZone && !showCreateForm && (
          <ZoneDetailPanel
            zone={selectedZone}
            logs={logs}
            canManage={canManage}
            isRep={isRep}
            currentRepId={currentRepId}
            onClose={() => setSelectedZoneId(null)}
            onUpdateStatus={handleUpdateStatus}
            onUpdateRep={handleUpdateRep}
            onUpdateNotes={handleUpdateNotes}
            onUpdateDate={handleUpdateDate}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default CarteTerritoiresPage;
