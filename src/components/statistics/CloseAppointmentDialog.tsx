import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  appointmentName: string;
  onConfirm: (closedValue: number, notes: string, wasRecovered: boolean) => void;
}

const CloseAppointmentDialog = ({ open, onClose, appointmentName, onConfirm }: Props) => {
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [wasRecovered, setWasRecovered] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (!value.trim() || isNaN(num) || num <= 0) {
      setError("Le montant signé est obligatoire et doit être supérieur à 0.");
      return;
    }
    setError("");
    onConfirm(num, notes, wasRecovered);
    setValue("");
    setNotes("");
    setWasRecovered(false);
    onClose();
    toast.success("Rendez-vous closé avec succès");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Clôturer — {appointmentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-muted-foreground">Montant signé ($) *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(""); }}
              placeholder="Ex: 12500"
              className="mt-1"
            />
            {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Deal récupéré (Hot Call / relance)</Label>
            <Switch checked={wasRecovered} onCheckedChange={setWasRecovered} />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur la vente..."
              className="mt-1 h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-xs">Annuler</Button>
          <Button onClick={handleSubmit} className="text-xs">Confirmer la clôture</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseAppointmentDialog;
