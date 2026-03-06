import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import L, { Map as LeafletMap, LayerGroup as LeafletLayerGroup, FeatureGroup as LeafletFeatureGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { useAuth } from "@/store/crm-store";
import { TerritoryStatus, TERRITORY_STATUSES } from "@/store/territory-store";
import { useTeamMembers, getRepNameFromList } from "@/hooks/useTeamMembers";
import { useMapZonesQuery, useZoneLogsQuery, useCreateZone, useUpdateZone, useDeleteZone, DbMapZone } from "@/hooks/useMapZones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Crosshair, Trash2, Loader2, ChevronDown, ChevronUp, X as XIcon, MapPin } from "lucide-react";
import { toast } from "sonner";
import ZoneFormPanel from "@/components/carte/ZoneFormPanel";
import ZoneDetailPanel from "@/components/carte/ZoneDetailPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_COLORS: Record<TerritoryStatus, string> = {
  "À faire": "#9ca3af",
  "Planifié aujourd'hui": "#3b82f6",
  "En cours": "#f97316",
  "Fait": "#22c55e",
};

const STATUS_BADGE: Record<TerritoryStatus, string> = {
  "À faire": "bg-muted text-muted-foreground",
  "Planifié aujourd'hui": "bg-info/20 text-info",
  "En cours": "bg-warning/20 text-warning",
  "Fait": "bg-green-500/20 text-green-400",
};

const getPolygonCenter = (polygon: [number, number][]): [number, number] => {
  const lat = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
  const lng = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
  return [lat, lng];
};

// getRepName moved inside component

const TerritoiresPage = () => {
  const { role, currentRepId } = useAuth();
  const isRep = role === "representant";
  const canManage = role === "proprietaire" || role === "gestionnaire";

  const { data: zones = [], isLoading } = useMapZonesQuery();
  const { data: teamMembers = [] } = useTeamMembers();
  const getRepName = (id: string) => getRepNameFromList(teamMembers, id);
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRep, setFilterRep] = useState("all");
  const [filterDate, setFilterDate] = useState("all");

  const [drawnPolygon, setDrawnPolygon] = useState<[number, number][] | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const addressMarkerRef = useRef<L.Marker | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const zoneLayerRef = useRef<LeafletLayerGroup | null>(null);
  const drawLayerRef = useRef<LeafletFeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const selectedZone = useMemo(() => zones.find((z) => z.id === selectedZoneId) ?? null, [zones, selectedZoneId]);
  const { data: logs = [] } = useZoneLogsQuery(selectedZoneId);

  const visibleZones = useMemo(() => {
    return zones
      .filter((z) => {
        if (isRep) return z.rep_id === currentRepId;
        if (filterRep === "unassigned") return !z.rep_id || z.rep_id === "";
        if (filterRep !== "all") return z.rep_id === filterRep;
        return true;
      })
      .filter((z) => filterStatus === "all" || z.status === filterStatus)
      .filter((z) => {
        if (filterDate === "today") return z.planned_date === today;
        if (filterDate === "week") return z.planned_date && z.planned_date >= today && z.planned_date <= weekEnd;
        return true;
      })
      .filter((z) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return z.name.toLowerCase().includes(q) || z.city.toLowerCase().includes(q) || (z.notes || "").toLowerCase().includes(q);
      });
  }, [zones, isRep, currentRepId, filterRep, filterStatus, filterDate, today, weekEnd, search]);

  const stats = useMemo(() => {
    const s = { total: visibleZones.length, "À faire": 0, "Planifié aujourd'hui": 0, "En cours": 0, "Fait": 0 };
    visibleZones.forEach((z) => { s[z.status]++; });
    return s;
  }, [visibleZones]);

  // Init map — polygon only, no rectangle
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

    if (canManage) {
      const drawControl = new L.Control.Draw({
        draw: {
          polygon: { allowIntersection: false, shapeOptions: { color: "#3b82f6", weight: 2 } },
          rectangle: false,
          polyline: false,
          circle: false,
          circlemarker: false,
          marker: false,
        },
        edit: { featureGroup: drawLayer, remove: true },
      });
      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      map.on(L.Draw.Event.DRAWSTART, () => {
        setIsDrawing(true);
      });

      map.on(L.Draw.Event.DRAWSTOP, () => {
        setIsDrawing(false);
      });

      map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        const latlngs = (layer.getLatLngs()[0] as L.LatLng[]);
        const polygon: [number, number][] = latlngs.map((ll) => [ll.lat, ll.lng]);
        drawLayer.addLayer(layer);
        setDrawnPolygon(polygon);
        setShowCreateForm(true);
        setSelectedZoneId(null);
        setIsDrawing(false);
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

  // Render zones on map
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

  const selectAndCenter = useCallback((zone: DbMapZone) => {
    setSelectedZoneId(zone.id);
    setShowCreateForm(false);
    setDrawnPolygon(null);
    drawLayerRef.current?.clearLayers();
    const center = getPolygonCenter(zone.polygon);
    mapRef.current?.flyTo(center, 14, { duration: 0.5 });
  }, []);

  // Cancel drawing with confirmation if form is open
  const handleCancelDraw = useCallback(() => {
    if (showCreateForm) {
      setShowCancelConfirm(true);
    } else {
      setDrawnPolygon(null);
      setShowCreateForm(false);
      setIsDrawing(false);
      drawLayerRef.current?.clearLayers();
    }
  }, [showCreateForm]);

  const confirmCancelDraw = useCallback(() => {
    setDrawnPolygon(null);
    setShowCreateForm(false);
    setIsDrawing(false);
    setShowCancelConfirm(false);
    drawLayerRef.current?.clearLayers();
  }, []);

  const handleAddressSearch = useCallback(async () => {
    if (!addressSearch.trim() || !mapRef.current) return;
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}&limit=1`
      );
      const data = await res.json();
      if (data.length === 0) {
        toast.error("Adresse non trouvée");
        return;
      }
      const { lat, lon } = data[0];
      const pos: [number, number] = [parseFloat(lat), parseFloat(lon)];
      // Remove previous marker
      if (addressMarkerRef.current) {
        addressMarkerRef.current.remove();
      }
      // Add temporary marker
      const marker = L.marker(pos, {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
      }).addTo(mapRef.current);
      addressMarkerRef.current = marker;
      mapRef.current.flyTo(pos, 16, { duration: 0.8 });
      // Auto-remove marker after 15s
      setTimeout(() => { marker.remove(); }, 15000);
    } catch {
      toast.error("Erreur de géocodage");
    } finally {
      setIsGeocoding(false);
    }
  }, [addressSearch]);

  const handleCreateZone = useCallback(async (data: {
    name: string; city: string; status: TerritoryStatus; repId: string; plannedDate: string; notes: string;
  }) => {
    if (!drawnPolygon) return;
    try {
      await createZone.mutateAsync({
        name: data.name, city: data.city, status: data.status, rep_id: data.repId,
        planned_date: data.plannedDate, notes: data.notes, polygon: drawnPolygon, created_by: role || "system",
      });
      toast.success("Territoire créé avec succès");
      setShowCreateForm(false);
      setDrawnPolygon(null);
      drawLayerRef.current?.clearLayers();
      // Keep map stable — force resize recalc
      setTimeout(() => { mapRef.current?.invalidateSize(); }, 100);
    } catch {
      toast.error("Erreur lors de la création");
    }
  }, [drawnPolygon, createZone, role]);

  const handleCancelCreate = useCallback(() => {
    setShowCancelConfirm(true);
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
    } catch { toast.error("Erreur lors de la mise à jour"); }
  }, [selectedZone, isRep, currentRepId, updateZone, role]);

  const handleInlineStatus = useCallback(async (zone: DbMapZone, status: TerritoryStatus) => {
    if (isRep && zone.rep_id !== currentRepId) return;
    try {
      await updateZone.mutateAsync({
        id: zone.id, updates: { status },
        statusChange: { previous: zone.status, next: status, changedBy: role || "system" },
      });
    } catch { toast.error("Erreur"); }
  }, [isRep, currentRepId, updateZone, role]);

  const handleInlineRep = useCallback(async (zone: DbMapZone, repId: string) => {
    if (!canManage) return;
    await updateZone.mutateAsync({ id: zone.id, updates: { rep_id: repId } });
  }, [canManage, updateZone]);

  const handleInlineDate = useCallback(async (zone: DbMapZone, date: string) => {
    await updateZone.mutateAsync({ id: zone.id, updates: { planned_date: date } });
  }, [updateZone]);

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

  const handleDelete = useCallback(async (id?: string) => {
    const targetId = id || selectedZone?.id;
    if (!targetId || !canManage) return;
    try {
      await deleteZone.mutateAsync(targetId);
      if (selectedZoneId === targetId) setSelectedZoneId(null);
      toast.success("Zone supprimée");
    } catch { toast.error("Erreur lors de la suppression"); }
  }, [selectedZone, selectedZoneId, canManage, deleteZone]);

  const showPanel = showCreateForm || selectedZone;

  // Invalidate map size when panel visibility changes
  useEffect(() => {
    setTimeout(() => { mapRef.current?.invalidateSize(); }, 100);
  }, [showPanel]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Sticky filter header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border px-2 py-2 shrink-0">
        {/* Mobile: collapsible toggle */}
        <div className="flex items-center justify-between sm:hidden mb-1">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            Filtres
            {filtersOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">{stats.total} zone{stats.total !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Desktop: always show, Mobile: collapsible */}
        <div className={`flex-wrap items-center gap-2 ${filtersOpen ? "flex" : "hidden sm:flex"}`}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="pl-9 w-[180px] h-8 text-sm"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] h-8 text-sm"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-popover">
              <SelectItem value="all">Tous les statuts</SelectItem>
              {TERRITORY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          {!isRep && (
            <Select value={filterRep} onValueChange={setFilterRep}>
              <SelectTrigger className="w-[150px] h-8 text-sm"><SelectValue placeholder="Représentant" /></SelectTrigger>
              <SelectContent className="z-[9999] bg-popover">
                <SelectItem value="all">Tous les reps</SelectItem>
                <SelectItem value="unassigned">Non assigné</SelectItem>
                {teamMembers.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-[130px] h-8 text-sm"><SelectValue placeholder="Date" /></SelectTrigger>
            <SelectContent className="z-[9999] bg-popover">
              <SelectItem value="all">Toutes dates</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
            </SelectContent>
          </Select>


          {/* Address geocoding search */}
          <div className="relative flex items-center gap-1">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddressSearch(); }}
              placeholder="Rechercher une adresse…"
              className="pl-9 w-[200px] h-8 text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleAddressSearch}
              disabled={isGeocoding || !addressSearch.trim()}
            >
              {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4 text-primary" />}
            </Button>
          </div>

          <div className="ml-auto hidden sm:flex items-center gap-3 text-xs">
            <span className="text-muted-foreground font-medium">{stats.total} territoire{stats.total !== 1 ? "s" : ""}</span>
            {TERRITORY_STATUSES.map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s] }} />
                <span className="text-muted-foreground">{stats[s]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content: Map + List + Panel overlay */}
      <div className="flex-1 flex gap-0 overflow-hidden relative min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[1001]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* LEFT: Map — always mounted, never hidden */}
        <div className="flex-1 relative min-w-0 z-0">
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        {/* RIGHT: List — hidden when panel is open */}
        <div className={`w-full sm:w-[420px] lg:w-[480px] border-l border-border overflow-y-auto bg-card/50 ${showPanel ? "hidden" : ""}`}>
          {visibleZones.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Aucun territoire trouvé.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nom</TableHead>
                  <TableHead className="text-xs">Statut</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Rep</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-xs w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleZones.map((z) => (
                  <TableRow
                    key={z.id}
                    className={`cursor-pointer ${z.id === selectedZoneId ? "bg-primary/10" : ""}`}
                    onClick={() => selectAndCenter(z)}
                  >
                    <TableCell className="py-2">
                      <div className="text-sm font-medium text-foreground truncate max-w-[140px]">{z.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{z.city}</div>
                    </TableCell>
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <Select value={z.status} onValueChange={(v) => handleInlineStatus(z, v as TerritoryStatus)}>
                        <SelectTrigger className="h-7 text-[11px] border-0 p-0 w-auto focus:ring-0">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[z.status]}`}>{z.status}</span>
                        </SelectTrigger>
                        <SelectContent className="z-[9999] bg-popover">
                          {TERRITORY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                      {canManage ? (
                        <Select value={z.rep_id} onValueChange={(v) => handleInlineRep(z, v)}>
                          <SelectTrigger className="h-7 text-[11px] border-0 p-0 w-auto focus:ring-0">
                            <span className="text-xs text-muted-foreground">{getRepName(z.rep_id)}</span>
                          </SelectTrigger>
                          <SelectContent className="z-[9999] bg-popover">
                            {teamMembers.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">{getRepName(z.rep_id)}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                      <Input
                        type="date"
                        value={z.planned_date || ""}
                        onChange={(e) => handleInlineDate(z, e.target.value)}
                        className="h-7 text-[11px] border-0 p-0 w-[110px] bg-transparent focus-visible:ring-0"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); selectAndCenter(z); }} title="Centrer sur la carte">
                          <Crosshair className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        {canManage && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDelete(z.id); }} title="Supprimer">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Overlay panels — above map with high z-index */}
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
            onDelete={() => handleDelete()}
          />
        )}
      </div>

      {/* Confirmation dialog for cancelling unsaved draw */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la création ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le polygone dessiné et les informations saisies seront perdus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer l'édition</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelDraw} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Annuler le dessin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TerritoiresPage;
