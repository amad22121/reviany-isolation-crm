import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SALES_REPS } from "@/data/crm-data";
import { TerritoryStatus, TERRITORY_STATUSES } from "@/store/territory-store";
import { X } from "lucide-react";

const todayStr = () => new Date().toISOString().split("T")[0];

interface ZoneFormPanelProps {
  onSubmit: (data: {
    name: string;
    city: string;
    status: TerritoryStatus;
    repId: string;
    plannedDate: string;
    notes: string;
  }) => void;
  onCancel: () => void;
}

const ZoneFormPanel = ({ onSubmit, onCancel }: ZoneFormPanelProps) => {
  const [name, setName] = useState("");
  const [city, setCity] = useState("Montréal");
  const [status, setStatus] = useState<TerritoryStatus>("À faire");
  const [repId, setRepId] = useState(SALES_REPS[0]?.id ?? "");
  const [plannedDate, setPlannedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [dateFait, setDateFait] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleStatusChange = (v: TerritoryStatus) => {
    setStatus(v);
    if (v === "Planifié aujourd'hui" && !plannedDate) {
      setPlannedDate(todayStr());
    }
    if (v === "Fait") {
      if (!plannedDate) setPlannedDate(todayStr());
      setDateFait(todayStr());
    } else {
      setDateFait("");
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Le nom est obligatoire";
    if (!status) e.status = "Le statut est obligatoire";
    if (status === "Planifié aujourd'hui" && !plannedDate) e.plannedDate = "La date est requise pour ce statut";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ name: name.trim(), city: city.trim(), status, repId, plannedDate, notes: notes.trim() });
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[360px] bg-card border-l border-border overflow-y-auto z-[1200] shadow-xl">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Nouvelle zone</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zone-name">Nom de la zone *</Label>
          <Input id="zone-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Plateau Mont-Royal" autoFocus />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zone-city">Ville</Label>
          <Input id="zone-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Montréal" />
        </div>

        <div className="space-y-1.5">
          <Label>Représentant assigné</Label>
          <Select value={repId} onValueChange={setRepId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="z-[9999]">
              {SALES_REPS.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Statut initial *</Label>
          <Select value={status} onValueChange={(v) => handleStatusChange(v as TerritoryStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="z-[9999]">
              {TERRITORY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zone-date">Date planifiée {status === "Planifié aujourd'hui" && "*"}</Label>
          <Input id="zone-date" type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
          {errors.plannedDate && <p className="text-xs text-destructive">{errors.plannedDate}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zone-notes">Notes terrain</Label>
          <Textarea id="zone-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Observations, remarques..." className="bg-secondary/50" />
        </div>

        {status === "Fait" && (
          <div className="space-y-1.5">
            <Label htmlFor="zone-date-fait">Date complété</Label>
            <Input id="zone-date-fait" type="date" value={dateFait} onChange={(e) => setDateFait(e.target.value)} />
          </div>
        )}

        <Button onClick={handleSubmit} className="w-full">Créer la zone</Button>
      </div>
    </div>
  );
};

export default ZoneFormPanel;
