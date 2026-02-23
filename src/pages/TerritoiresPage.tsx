import { useState } from "react";
import { useAuth } from "@/store/crm-store";
import { useTerritories, Territory, TerritoryStatus, TERRITORY_STATUSES } from "@/store/territory-store";
import { SALES_REPS } from "@/data/crm-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Pencil, Eye, Plus, History, Trash2 } from "lucide-react";

const statusColors: Record<TerritoryStatus, string> = {
  "À faire": "bg-warning/20 text-warning border-warning/30",
  "Planifié aujourd'hui": "bg-info/20 text-info border-info/30",
  "En cours": "bg-primary/20 text-primary border-primary/30",
  "Fait": "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusOrder: Record<TerritoryStatus, number> = {
  "Planifié aujourd'hui": 0,
  "À faire": 1,
  "En cours": 2,
  "Fait": 3,
};

const getRepName = (id: string) => SALES_REPS.find((r) => r.id === id)?.name || id;

const TerritoiresPage = () => {
  const { role, currentRepId } = useAuth();
  const { territories, addTerritory, updateTerritoryStatus, updateTerritory, deleteTerritory } = useTerritories();
  const isRep = role === "representant";
  const canManage = role === "proprietaire" || role === "gestionnaire";

  const [filterCity, setFilterCity] = useState("all");
  const [filterRep, setFilterRep] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);

  // Add form state
  const [form, setForm] = useState({ city: "", sector: "", street: "", repId: SALES_REPS[0]?.id || "", estimatedDoors: "", notes: "", status: "À faire" as TerritoryStatus });

  const cities = [...new Set(territories.map((t) => t.city))].sort();

  const filtered = territories
    .filter((t) => {
      if (isRep) return t.repId === currentRepId;
      if (filterRep !== "all" && t.repId !== filterRep) return false;
      return true;
    })
    .filter((t) => filterCity === "all" || t.city === filterCity)
    .filter((t) => filterStatus === "all" || t.status === filterStatus)
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  const stats = {
    total: filtered.length,
    aFaire: filtered.filter((t) => t.status === "À faire").length,
    enCours: filtered.filter((t) => t.status === "En cours").length,
    fait: filtered.filter((t) => t.status === "Fait").length,
    planifie: filtered.filter((t) => t.status === "Planifié aujourd'hui").length,
  };

  const handleAdd = () => {
    if (!form.city || !form.sector || !form.street) return;
    addTerritory({
      city: form.city,
      sector: form.sector,
      street: form.street,
      status: form.status,
      repId: isRep ? (currentRepId || "") : form.repId,
      lastVisitDate: "",
      estimatedDoors: form.estimatedDoors ? parseInt(form.estimatedDoors) : null,
      notes: form.notes,
    });
    setForm({ city: "", sector: "", street: "", repId: SALES_REPS[0]?.id || "", estimatedDoors: "", notes: "", status: "À faire" });
    setAddOpen(false);
  };

  const handleStatusChange = (id: string, status: TerritoryStatus) => {
    updateTerritoryStatus(id, status, role || "system");
  };

  const openMaps = (t: Territory) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.street}, ${t.sector}, ${t.city}`)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Ville" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les villes</SelectItem>
            {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        {!isRep && (
          <Select value={filterRep} onValueChange={setFilterRep}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Représentant" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les reps</SelectItem>
              {SALES_REPS.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {TERRITORY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={() => setAddOpen(true)} className="ml-auto">
          <Plus className="h-4 w-4 mr-1" /> Ajouter un territoire
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Planifiés aujourd'hui", value: stats.planifie, color: "text-info" },
          { label: "À faire", value: stats.aFaire, color: "text-warning" },
          { label: "En cours", value: stats.enCours, color: "text-primary" },
          { label: "Faits", value: stats.fait, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">Aucun territoire trouvé.</div>
      ) : (
        <div className="space-y-2">
          {/* Header - desktop */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_1.5fr_140px_100px_110px_100px] gap-3 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide">
            <span>Ville</span>
            <span>Secteur</span>
            <span>Rue</span>
            <span>Statut</span>
            <span>Rep</span>
            <span>Dernière visite</span>
            <span>Actions</span>
          </div>

          {filtered.map((t) => (
            <div key={t.id} className="glass-card p-4">
              {/* Desktop */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_1.5fr_140px_100px_110px_100px] gap-3 items-center">
                <span className="text-sm text-foreground truncate">{t.city}</span>
                <span className="text-sm text-foreground truncate">{t.sector}</span>
                <span className="text-sm text-foreground truncate">{t.street}</span>
                <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v as TerritoryStatus)}>
                  <SelectTrigger className="h-7 text-xs border-0 p-0 focus:ring-0">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusColors[t.status]}`}>
                      {t.status}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {TERRITORY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">{getRepName(t.repId)}</span>
                <span className="text-xs text-muted-foreground">{t.lastVisitDate || "—"}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openMaps(t)} title="Google Maps">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedTerritory(t); setDetailOpen(true); }} title="Détails">
                    <Eye className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  {canManage && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTerritory(t.id)} title="Supprimer">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Mobile */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{t.sector}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusColors[t.status]}`}>{t.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t.street}</p>
                <p className="text-xs text-muted-foreground">{t.city} · {getRepName(t.repId)} · {t.lastVisitDate || "Pas encore visité"}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => openMaps(t)}>
                    <MapPin className="h-3.5 w-3.5 mr-1" /> Maps
                  </Button>
                  <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v as TerritoryStatus)}>
                    <SelectTrigger className="flex-1 h-9 text-xs">
                      <Pencil className="h-3 w-3 mr-1" /> Statut
                    </SelectTrigger>
                    <SelectContent>
                      {TERRITORY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => { setSelectedTerritory(t); setDetailOpen(true); }}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Détails
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Territory Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <DialogHeader><DialogTitle>Ajouter un territoire</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Ville *</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Montréal" /></div>
              <div><Label className="text-xs">Secteur *</Label><Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="Plateau" /></div>
            </div>
            <div><Label className="text-xs">Rue / Zone *</Label><Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="Rue Saint-Denis (entre X et Y)" /></div>
            <div className="grid grid-cols-2 gap-3">
              {!isRep && (
                <div>
                  <Label className="text-xs">Représentant</Label>
                  <Select value={form.repId} onValueChange={(v) => setForm({ ...form, repId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SALES_REPS.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs">Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TerritoryStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TERRITORY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Portes estimées</Label><Input type="number" value={form.estimatedDoors} onChange={(e) => setForm({ ...form, estimatedDoors: e.target.value })} placeholder="Ex: 40" /></div>
            <div><Label className="text-xs">Notes terrain</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observations..." rows={3} /></div>
            <Button onClick={handleAdd} disabled={!form.city || !form.sector || !form.street} className="w-full">Ajouter</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[520px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Fiche Territoire</DialogTitle></DialogHeader>
          {selectedTerritory && (
            <div className="space-y-5 mt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{selectedTerritory.sector}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[selectedTerritory.status]}`}>{selectedTerritory.status}</span>
              </div>

              <div className="glass-card p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground text-xs">Ville</span><p className="text-foreground">{selectedTerritory.city}</p></div>
                  <div><span className="text-muted-foreground text-xs">Représentant</span><p className="text-foreground">{getRepName(selectedTerritory.repId)}</p></div>
                  <div><span className="text-muted-foreground text-xs">Dernière visite</span><p className="text-foreground">{selectedTerritory.lastVisitDate || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Portes estimées</span><p className="text-foreground">{selectedTerritory.estimatedDoors ?? "—"}</p></div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Rue / Zone</span>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedTerritory.street}, ${selectedTerritory.sector}, ${selectedTerritory.city}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline mt-0.5">
                    <MapPin className="h-3.5 w-3.5" /> {selectedTerritory.street}
                  </a>
                </div>
              </div>

              {selectedTerritory.notes && (
                <div className="glass-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Notes terrain</p>
                  <p className="text-sm text-foreground">{selectedTerritory.notes}</p>
                </div>
              )}

              {selectedTerritory.statusLog.length > 0 && (
                <div className="glass-card p-4 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <History className="h-4 w-4" /> Historique
                  </h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {[...selectedTerritory.statusLog].reverse().map((log, i) => (
                      <div key={i} className="bg-secondary/50 rounded-lg p-3 flex items-start gap-3">
                        <div className="shrink-0 text-xs text-muted-foreground w-20">
                          <div>{log.date}</div>
                          <div>{log.time}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{log.previousValue} → {log.newValue}</p>
                          <p className="text-[10px] text-muted-foreground">par {log.userId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TerritoiresPage;
