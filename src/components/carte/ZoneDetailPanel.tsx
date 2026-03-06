import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTeamMembers, getRepNameFromList } from "@/hooks/useTeamMembers";
import { TerritoryStatus, TERRITORY_STATUSES } from "@/store/territory-store";
import { X, History, ExternalLink, Trash2 } from "lucide-react";
import { DbMapZone, DbStatusLog } from "@/hooks/useMapZones";

const STATUS_BADGE: Record<TerritoryStatus, string> = {
  "À faire": "bg-muted text-muted-foreground border-border",
  "Planifié aujourd'hui": "bg-info/20 text-info border-info/30",
  "En cours": "bg-warning/20 text-warning border-warning/30",
  "Fait": "bg-green-500/20 text-green-400 border-green-500/30",
};


const getPolygonCenter = (polygon: [number, number][]): [number, number] => {
  const lat = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
  const lng = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
  return [lat, lng];
};

interface ZoneDetailPanelProps {
  zone: DbMapZone;
  logs: DbStatusLog[];
  canManage: boolean;
  isRep: boolean;
  currentRepId: string | null;
  onClose: () => void;
  onUpdateStatus: (status: TerritoryStatus) => void;
  onUpdateRep: (repId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateDate: (date: string) => void;
  onDelete: () => void;
}

const ZoneDetailPanel = ({
  zone,
  logs,
  canManage,
  isRep,
  currentRepId,
  onClose,
  onUpdateStatus,
  onUpdateRep,
  onUpdateNotes,
  onUpdateDate,
  onDelete,
}: ZoneDetailPanelProps) => {
  const { data: teamMembers = [] } = useTeamMembers();
}: ZoneDetailPanelProps) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState(zone.notes || "");
  const canEdit = canManage || (isRep && zone.rep_id === currentRepId);

  const openGoogleMaps = () => {
    const center = getPolygonCenter(zone.polygon);
    window.open(`https://www.google.com/maps/search/?api=1&query=${center[0]},${center[1]}`, "_blank");
  };

  const handleSaveNotes = () => {
    onUpdateNotes(notesInput);
    setEditingNotes(false);
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[340px] bg-card border-l border-border overflow-y-auto z-[1200] shadow-xl">
      <div className="p-4 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{zone.name}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${STATUS_BADGE[zone.status]}`}>
          {zone.status}
        </span>

        <div className="space-y-3">
          <div className="text-sm">
            <span className="text-muted-foreground text-xs">Ville</span>
            <p className="text-foreground">{zone.city || "—"}</p>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground text-xs">Représentant</span>
            {canManage ? (
              <Select value={zone.rep_id} onValueChange={onUpdateRep}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[9999]">{teamMembers.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <p className="text-foreground">{getRepNameFromList(teamMembers, zone.rep_id)}</p>
            )}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground text-xs">Date planifiée</span>
            {canEdit ? (
              <Input type="date" value={zone.planned_date || ""} onChange={(e) => onUpdateDate(e.target.value)} className="mt-1" />
            ) : (
              <p className="text-foreground">{zone.planned_date || "—"}</p>
            )}
          </div>
        </div>

        {canEdit && (
          <div>
            <span className="text-muted-foreground text-xs">Modifier le statut</span>
            <Select value={zone.status} onValueChange={(v) => onUpdateStatus(v as TerritoryStatus)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[9999]">{TERRITORY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted-foreground text-xs">Notes terrain</span>
            {canEdit && (editingNotes ? (
              <button onClick={handleSaveNotes} className="text-xs text-primary hover:opacity-80">Sauvegarder</button>
            ) : (
              <button onClick={() => { setNotesInput(zone.notes || ""); setEditingNotes(true); }} className="text-xs text-muted-foreground hover:text-primary">Modifier</button>
            ))}
          </div>
          {editingNotes ? (
            <Textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)} rows={3} className="bg-secondary/50" autoFocus />
          ) : (
            <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3">{zone.notes || <span className="text-muted-foreground italic">Aucune note</span>}</p>
          )}
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={openGoogleMaps}>
          <ExternalLink className="h-4 w-4 mr-2" /> Ouvrir dans Google Maps
        </Button>

        {canManage && (
          <Button variant="destructive" size="sm" className="w-full" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" /> Supprimer la zone
          </Button>
        )}

        {/* Historique section — shows logs or placeholder */}
        <div className="space-y-2">
          <h4 className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" /> Historique
          </h4>

          {/* Meta: created + last change */}
          <div className="bg-secondary/50 rounded-lg p-2.5 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Créé le</span>
              <span className="text-foreground">
                {new Date(zone.created_at).toLocaleDateString("fr-CA")}{" "}
                {new Date(zone.created_at).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dernier changement</span>
              <span className="text-foreground">
                {logs.length > 0
                  ? `${new Date(logs[0].changed_at).toLocaleDateString("fr-CA")} ${new Date(logs[0].changed_at).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}`
                  : "—"}
              </span>
            </div>
          </div>

          {logs.length > 0 && (
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="bg-secondary/50 rounded-lg p-2.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{new Date(log.changed_at).toLocaleDateString("fr-CA")} {new Date(log.changed_at).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>par {log.changed_by}</span>
                  </div>
                  <p className="text-foreground mt-0.5">{log.previous_status} → {log.new_status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoneDetailPanel;
