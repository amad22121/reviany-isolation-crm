import { useState } from "react";
import { Appointment, SALES_REPS, HotCall, CallLogEntry } from "@/data/crm-data";
import { useCrm } from "@/store/crm-store";
import { useAuth } from "@/store/crm-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MapPin, Phone, Calendar, Clock, User, HelpCircle, StickyNote, Pencil, Check, Trash2, BadgeCheck, History } from "lucide-react";

const statusColors: Record<string, string> = {
  "En attente": "bg-warning/20 text-warning border-warning/30",
  "Confirmé": "bg-green-500/20 text-green-400 border-green-500/30",
  "Non confirmé": "bg-destructive/20 text-destructive border-destructive/30",
  "Closed": "bg-info/20 text-info border-info/30",
  "Annulé": "bg-muted text-muted-foreground border-border",
};

interface FicheClientProps {
  appointment: Appointment | null;
  hotCall?: HotCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FicheClient = ({ appointment, hotCall, open, onOpenChange }: FicheClientProps) => {
  const { updateNotes, deleteAppointment } = useCrm();
  const { role } = useAuth();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!appointment) return null;

  const rep = SALES_REPS.find((r) => r.id === appointment.repId);
  const canDelete = role === "proprietaire" || role === "gestionnaire";

  const origin = hotCall?.origin || appointment.origin;
  const callHistory = hotCall?.callHistory || [];

  const handleEditNotes = () => {
    setNotesInput(appointment.notes || "");
    setEditingNotes(true);
  };

  const handleSaveNotes = () => {
    updateNotes(appointment.id, notesInput);
    setEditingNotes(false);
  };

  const handleDelete = () => {
    deleteAppointment(appointment.id);
    setConfirmOpen(false);
    onOpenChange(false);
  };

  const getRepName = (repId: string) => SALES_REPS.find((r) => r.id === repId)?.name || repId;

  const displayStatus = hotCall ? hotCall.status : appointment.status;
  const resultLabel = appointment.result;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) setEditingNotes(false); onOpenChange(o); }}>
        <DialogContent className="sm:max-w-[560px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Fiche Client
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {/* Client name & status */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {appointment.fullName}
              </h2>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[appointment.status] || "bg-secondary text-secondary-foreground border-border"}`}>
                  {displayStatus}
                </span>
                {resultLabel && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-info/20 text-info border border-info/30">
                    {resultLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Informations principales + Origine */}
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Informations principales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">{appointment.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">{appointment.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">{appointment.time || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">{rep?.name || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground text-xs mr-1">Origine:</span>
                  <span className={`text-sm ${origin ? "text-foreground" : "text-muted-foreground italic"}`}>
                    {origin || "Non renseigné"}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm pt-1">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${appointment.address}, ${appointment.city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {appointment.address}, {appointment.city}
                </a>
              </div>
            </div>

            {/* Préqualification */}
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <HelpCircle className="h-4 w-4" /> Questions de préqualification
              </h3>
              <div className="space-y-2">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Question A</p>
                  <p className="text-sm text-muted-foreground italic">{appointment.preQual1 || "Réponse à compléter ici"}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Question B</p>
                  <p className="text-sm text-muted-foreground italic">{appointment.preQual2 || "Réponse à compléter ici"}</p>
                </div>
              </div>
            </div>

            {/* Historique des appels */}
            {callHistory.length > 0 && (
              <div className="glass-card p-4 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <History className="h-4 w-4" /> Historique des appels
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {[...callHistory].reverse().map((entry, i) => (
                    <div key={i} className="bg-secondary/50 rounded-lg p-3 flex items-start gap-3">
                      <div className="shrink-0 text-xs text-muted-foreground w-20">
                        <div>{entry.date}</div>
                        <div>{entry.time}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-primary font-medium">{getRepName(entry.repId)}</p>
                        <p className="text-sm text-foreground">{entry.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status change log */}
            {appointment.statusLog && appointment.statusLog.length > 0 && (
              <div className="glass-card p-4 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <History className="h-4 w-4" /> Historique des changements
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {[...appointment.statusLog].reverse().map((log, i) => (
                    <div key={i} className="bg-secondary/50 rounded-lg p-3 flex items-start gap-3">
                      <div className="shrink-0 text-xs text-muted-foreground w-20">
                        <div>{log.date}</div>
                        <div>{log.time}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-primary font-medium">{log.field === "status" ? "Statut" : "Résultat"}</p>
                        <p className="text-sm text-foreground">{log.previousValue} → {log.newValue}</p>
                        <p className="text-[10px] text-muted-foreground">par {log.userId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes - editable */}
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <StickyNote className="h-4 w-4" /> Notes
                </h3>
                {!hotCall && (
                  editingNotes ? (
                    <button
                      onClick={handleSaveNotes}
                      className="flex items-center gap-1 text-xs text-primary hover:opacity-80 font-medium"
                    >
                      <Check className="h-3.5 w-3.5" /> Sauvegarder
                    </button>
                  ) : (
                    <button
                      onClick={handleEditNotes}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Modifier
                    </button>
                  )
                )}
              </div>
              {editingNotes ? (
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full min-h-[80px] bg-secondary/50 border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  autoFocus
                />
              ) : (
              <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3">
                {appointment.notes || <span className="text-muted-foreground italic">Notes détaillées à ajouter ici</span>}
              </p>
              )}
            </div>

            {/* Delete button */}
            {canDelete && !hotCall && (
              <div className="flex justify-end">
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette fiche client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous certain de vouloir supprimer cette fiche client ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FicheClient;
