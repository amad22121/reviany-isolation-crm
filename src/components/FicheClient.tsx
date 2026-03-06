import { useState, useRef, useEffect, useMemo } from "react";
import { Appointment, AppointmentStatus, HotCall, CallLogEntry } from "@/data/crm-data";
import { useTeamMembers, getRepNameFromList } from "@/hooks/useTeamMembers";
import ClientPhotosSection from "@/components/ClientPhotosSection";
import { useCrm } from "@/store/crm-store";
import { useAuth } from "@/store/crm-store";
import { useUpdateAppointmentStatus, useUpdateAppointmentNotes, useDeleteAppointment as useDeleteApptMutation } from "@/hooks/useAppointments";
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
import { MapPin, Phone, Calendar, Clock, User, StickyNote, Pencil, Check, Trash2, BadgeCheck, History, Briefcase, ClipboardCheck, Tag } from "lucide-react";

const statusColors: Record<string, string> = {
  "Planifié": "bg-warning/20 text-warning border-warning/30",
  "Confirmé": "bg-green-500/20 text-green-400 border-green-500/30",
  "Non confirmé": "bg-orange-300/20 text-orange-300 border-orange-300/30",
  "À risque": "bg-destructive/20 text-destructive border-destructive/30",
  "Reporté": "bg-blue-400/20 text-blue-400 border-blue-400/30",
  "Annulé (à rappeler)": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Annulé (définitif)": "bg-muted text-muted-foreground border-border",
  "No-show": "bg-red-400/20 text-red-400 border-red-400/30",
  "Closé": "bg-info/20 text-info border-info/30",
};

interface FicheClientProps {
  appointment: Appointment | null;
  hotCall?: HotCall | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALL_STATUSES: AppointmentStatus[] = ["Planifié", "Confirmé", "Non confirmé", "À risque", "Reporté", "Annulé (à rappeler)", "Annulé (définitif)", "No-show", "Closé"];

// ── Helper: parse preQual1 pipe-delimited string into structured data ──
function parsePreQual(preQual1: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!preQual1) return result;
  const parts = preQual1.split(" | ");
  for (const part of parts) {
    const colonIdx = part.indexOf(": ");
    if (colonIdx > 0) {
      const key = part.substring(0, colonIdx).trim();
      const value = part.substring(colonIdx + 2).trim();
      result[key] = value;
    }
  }
  return result;
}

const EmptyValue = () => <span className="text-muted-foreground italic text-xs">Non renseigné</span>;

const FicheClient = ({ appointment, hotCall, open, onOpenChange }: FicheClientProps) => {
  const { updateNotes, deleteAppointment, updateStatus, moveAppointmentToHotCalls } = useCrm();
  const { role } = useAuth();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    if (statusDropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusDropdownOpen]);

  // Parse prequal data
  const preQualData = useMemo(() => {
    if (!appointment) return {};
    return parsePreQual(appointment.preQual1);
  }, [appointment?.preQual1]);

  // Determine if we have new structured prequal or old format
  const hasStructuredPreQual = useMemo(() => {
    return Object.keys(preQualData).some(k =>
      ["Travail réalisé", "Inspection", "Années propriétaire", "Secteur", "Travaux", "Inspecteur", "Délai décision"].includes(k)
    );
  }, [preQualData]);

  if (!appointment) return null;

  const { data: teamMembers = [] } = useTeamMembers();
  const rep = teamMembers.find((r) => r.id === appointment.repId);
  const canDelete = role === "proprietaire" || role === "gestionnaire";

  const allowedStatuses: AppointmentStatus[] = (() => {
    if (role === "proprietaire") return ALL_STATUSES;
    if (role === "gestionnaire") return ALL_STATUSES;
    return ["Planifié", "Confirmé"] as AppointmentStatus[];
  })();

  const canEditStatus = !hotCall && allowedStatuses.length > 0;

  const handleStatusChange = (newStatus: AppointmentStatus) => {
    if (newStatus === appointment.status) { setStatusDropdownOpen(false); return; }
    const userId = role || "system";
    updateStatus(appointment.id, newStatus, userId);
    if (newStatus === "Annulé (à rappeler)" || newStatus === "Non confirmé" || newStatus === "No-show") {
      moveAppointmentToHotCalls(appointment.id, "Premier contact");
    }
    setStatusDropdownOpen(false);
  };

  // Resolve cultural origin and lead source
  const culturalOrigin = appointment.culturalOrigin || null;
  const leadSource = appointment.leadSource || appointment.origin || appointment.source || null;
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

  const getRepName = (repId: string) => getRepNameFromList(teamMembers, repId);

  const displayStatus = hotCall ? hotCall.status : appointment.status;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) setEditingNotes(false); onOpenChange(o); }}>
        <DialogContent className="sm:max-w-[560px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Fiche Client
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Client name & status */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {appointment.fullName}
              </h2>
              {canEditStatus ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:brightness-110 transition-colors ${statusColors[appointment.status] || "bg-secondary text-secondary-foreground border-border"}`}
                  >
                    {appointment.status} ▾
                  </button>
                  {statusDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                      {ALL_STATUSES.map((s) => {
                        const allowed = allowedStatuses.includes(s);
                        return (
                          <button
                            key={s}
                            disabled={!allowed}
                            onClick={() => allowed && handleStatusChange(s)}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                              s === appointment.status
                                ? "bg-primary/10 text-primary font-medium"
                                : allowed
                                ? "text-foreground hover:bg-secondary"
                                : "text-muted-foreground/40 cursor-not-allowed"
                            }`}
                          >
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              s === "Planifié" ? "bg-warning" :
                              s === "Confirmé" ? "bg-green-500" :
                              s === "Non confirmé" ? "bg-orange-300" :
                              s === "À risque" ? "bg-destructive" :
                              s === "Reporté" ? "bg-blue-400" :
                              s === "Annulé (à rappeler)" ? "bg-amber-400" :
                              s === "No-show" ? "bg-red-400" :
                              s === "Closé" ? "bg-info" : "bg-muted-foreground"
                            }`} />
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[appointment.status] || "bg-secondary text-secondary-foreground border-border"}`}>
                  {displayStatus}
                </span>
              )}
            </div>

            {/* ── A) Informations principales ── */}
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Informations principales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone */}
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <a href={`tel:${appointment.phone}`} className="text-primary hover:underline">
                    {appointment.phone}
                  </a>
                </div>
                {/* Rep */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground text-xs mr-1">Rep:</span>
                  <span className="text-foreground">{rep?.name || "—"}</span>
                </div>
                {/* Date */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">{appointment.date || "—"}</span>
                </div>
                {/* Time */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground">{appointment.time || "—"}</span>
                </div>
                {/* Cultural origin */}
                <div className="flex items-center gap-2 text-sm">
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground text-xs mr-1">Origine / profil:</span>
                  <span className="text-foreground">{culturalOrigin || <EmptyValue />}</span>
                </div>
                {/* Lead source */}
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground text-xs mr-1">Source:</span>
                  <span className="text-foreground">{leadSource || <EmptyValue />}</span>
                </div>
              </div>
              {/* Address with Google Maps link */}
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

            {/* ── B) Préqualification ── */}
            <div className="glass-card p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" /> Préqualification
              </h3>

              {hasStructuredPreQual ? (
                <div className="space-y-2">
                  {/* 1. Travail réalisé */}
                  <PreQualRow
                    label="Ce travail a déjà été réalisé ?"
                    value={preQualData["Travail réalisé"]}
                  />
                  {/* 2. Inspection */}
                  <PreQualRow
                    label="Rapport d'inspection ?"
                    value={preQualData["Inspection"]}
                  />
                  {preQualData["Inspection"] === "Oui" && (
                    <>
                      <PreQualRow
                        label="Par qui a-t-il été fait ?"
                        value={preQualData["Inspecteur"]}
                        indent
                      />
                      <PreQualRow
                        label="Délais de décision"
                        value={preQualData["Délai décision"]}
                        indent
                      />
                    </>
                  )}
                  {/* 3. Durée propriété */}
                  <PreQualRow
                    label="Durée de propriété (années)"
                    value={preQualData["Années propriétaire"]}
                  />
                  {/* 4. Domaine */}
                  <PreQualRow
                    label="Domaine d'activité"
                    value={preQualData["Secteur"]}
                  />
                  {/* 5. Travaux */}
                  <PreQualRow
                    label="Travaux récents / investissements futurs"
                    value={preQualData["Travaux"]}
                  />
                </div>
              ) : (
                /* Legacy fallback: show raw preQual1 / preQual2 */
                <div className="space-y-2">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Préqualification</p>
                    <p className="text-sm text-foreground">{appointment.preQual1 || <EmptyValue />}</p>
                  </div>
                  {appointment.preQual2 && (
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Détails supplémentaires</p>
                      <p className="text-sm text-foreground">{appointment.preQual2}</p>
                    </div>
                  )}
                </div>
              )}
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
                        <p className="text-xs text-primary font-medium">Statut</p>
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
                {appointment.notes || <EmptyValue />}
              </p>
              )}
            </div>

            {/* Photos section */}
            <ClientPhotosSection clientPhone={appointment.phone} clientName={appointment.fullName} />

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

// ── Sub-component for prequal rows ──
function PreQualRow({ label, value, indent }: { label: string; value?: string; indent?: boolean }) {
  return (
    <div className={`bg-secondary/50 rounded-lg p-3 ${indent ? "ml-4 border-l-2 border-primary/30" : ""}`}>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground">{value || <EmptyValue />}</p>
    </div>
  );
}

export default FicheClient;
