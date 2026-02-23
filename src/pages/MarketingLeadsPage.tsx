import { useState, useMemo } from "react";
import { useAuth } from "@/store/crm-store";
import { useCrm } from "@/store/crm-store";
import { SALES_REPS } from "@/data/crm-data";
import ClientPhotosSection from "@/components/ClientPhotosSection";
import {
  useMarketingLeadsQuery,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  LEAD_STATUSES,
  LeadStatus,
  MarketingLead,
} from "@/hooks/useMarketingLeads";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  Plus,
  Phone,
  User,
  Trash2,
  X,
  ChevronDown,
  Megaphone,
  UserPlus,
  PhoneCall,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const STATUS_COLORS: Record<LeadStatus, string> = {
  "New Lead": "bg-blue-500/20 text-blue-400",
  "Attempted Contact": "bg-warning/20 text-warning",
  "Contacted": "bg-purple-500/20 text-purple-400",
  "Appointment Booked": "bg-green-500/20 text-green-400",
  "Closed": "bg-info/20 text-info",
  "Not Closed": "bg-destructive/20 text-destructive",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  "New Lead": "Nouveau",
  "Attempted Contact": "Tentative",
  "Contacted": "Contacté",
  "Appointment Booked": "RDV Booké",
  "Closed": "Fermé",
  "Not Closed": "Non fermé",
};

const getRepName = (repId: string | null) =>
  repId ? SALES_REPS.find((r) => r.id === repId)?.name || repId : "—";

const MarketingLeadsPage = () => {
  const { role } = useAuth();
  const { addAppointment } = useCrm();
  const { data: leads = [], isLoading } = useMarketingLeadsQuery();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [repFilter, setRepFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<MarketingLead | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bookingLead, setBookingLead] = useState<MarketingLead | null>(null);

  // New lead form
  const [newForm, setNewForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    has_attic: "",
    notes: "",
  });

  // Booking form
  const [bookForm, setBookForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    repId: "",
  });

  const canEdit = role === "proprietaire" || role === "gestionnaire";
  const canDelete = role === "proprietaire" || role === "gestionnaire";

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        l.full_name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.address || "").toLowerCase().includes(q) ||
        (l.city || "").toLowerCase().includes(q) ||
        (l.notes || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      const matchRep =
        repFilter === "all" ||
        (repFilter === "unassigned" ? !l.assigned_rep_id : l.assigned_rep_id === repFilter);
      return matchSearch && matchStatus && matchRep;
    });
  }, [leads, search, statusFilter, repFilter]);

  // KPI counts
  const kpis = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === "New Lead").length;
    const attempted = leads.filter((l) => l.status === "Attempted Contact").length;
    const booked = leads.filter((l) => l.status === "Appointment Booked").length;
    const closed = leads.filter((l) => l.status === "Closed").length;
    const notClosed = leads.filter((l) => l.status === "Not Closed").length;
    return { total, newCount, attempted, booked, closed, notClosed };
  }, [leads]);

  const handleCreateLead = async () => {
    if (!newForm.full_name.trim() || !newForm.phone.trim()) return;
    await createLead.mutateAsync({
      full_name: newForm.full_name.trim(),
      phone: newForm.phone.trim(),
      address: newForm.address.trim(),
      city: newForm.city.trim(),
      has_attic: newForm.has_attic,
      source: "Facebook",
      status: "New Lead",
      assigned_rep_id: null,
      attempts_count: 0,
      last_contact_date: null,
      notes: newForm.notes.trim(),
      next_followup_date: null,
      converted_appointment_id: null,
      created_by_user_id: role || "",
    });
    setNewForm({ full_name: "", phone: "", address: "", city: "", has_attic: "", notes: "" });
    setShowNewForm(false);
  };

  const handleIncrementAttempts = async (lead: MarketingLead) => {
    const now = new Date().toISOString();
    await updateLead.mutateAsync({
      id: lead.id,
      updates: {
        attempts_count: lead.attempts_count + 1,
        last_contact_date: now,
        status: lead.status === "New Lead" ? "Attempted Contact" : lead.status,
      },
    });
  };

  const handleStatusChange = async (lead: MarketingLead, newStatus: LeadStatus) => {
    if (newStatus === "Appointment Booked" && lead.status !== "Appointment Booked") {
      setBookingLead(lead);
      setBookForm({
        date: new Date().toISOString().split("T")[0],
        time: "09:00",
        repId: lead.assigned_rep_id || "",
      });
      return;
    }
    await updateLead.mutateAsync({
      id: lead.id,
      updates: { status: newStatus },
    });
    if (selectedLead?.id === lead.id) {
      setSelectedLead({ ...lead, status: newStatus });
    }
  };

  const handleBookAppointment = async () => {
    if (!bookingLead || !bookForm.date || !bookForm.repId) return;
    const apptId = `a${Date.now()}`;
    addAppointment({
      fullName: bookingLead.full_name,
      phone: bookingLead.phone,
      address: bookingLead.address || "",
      city: bookingLead.city || "",
      date: bookForm.date,
      time: bookForm.time,
      repId: bookForm.repId,
      preQual1: "",
      preQual2: "",
      notes: bookingLead.notes || "",
      status: "En attente",
      source: "Referral",
    });
    await updateLead.mutateAsync({
      id: bookingLead.id,
      updates: {
        status: "Appointment Booked",
        converted_appointment_id: apptId,
        assigned_rep_id: bookForm.repId,
      },
    });
    setBookingLead(null);
  };

  const handleDelete = async (id: string) => {
    await deleteLead.mutateAsync(id);
    setDeleteConfirm(null);
    if (selectedLead?.id === id) setSelectedLead(null);
  };

  const handleUpdateField = async (lead: MarketingLead, field: string, value: any) => {
    await updateLead.mutateAsync({ id: lead.id, updates: { [field]: value } });
    if (selectedLead?.id === lead.id) {
      setSelectedLead({ ...lead, [field]: value });
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Marketing Leads
          </h1>
          {canEdit && (
            <Button size="sm" onClick={() => setShowNewForm(true)} className="gap-1">
              <Plus className="h-4 w-4" /> Nouveau Lead
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: kpis.total, icon: Megaphone, color: "text-primary" },
            { label: "Nouveaux", value: kpis.newCount, icon: UserPlus, color: "text-blue-400" },
            { label: "Tentatives", value: kpis.attempted, icon: PhoneCall, color: "text-warning" },
            { label: "RDV Bookés", value: kpis.booked, icon: CalendarCheck, color: "text-green-400" },
            { label: "Fermés", value: kpis.closed, icon: CheckCircle2, color: "text-info" },
            { label: "Non fermés", value: kpis.notClosed, icon: XCircle, color: "text-destructive" },
          ].map((k) => (
            <div key={k.label} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Rechercher nom, téléphone, adresse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={repFilter}
            onChange={(e) => setRepFilter(e.target.value)}
          >
            <option value="all">Tous les reps</option>
            <option value="unassigned">Non assigné</option>
            {SALES_REPS.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Counter */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} lead{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Nom", "Téléphone", "Ville", "Statut", "Rep", "Tentatives", "Suivi", "Créé le", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Chargement...</td></tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Aucun lead trouvé</td></tr>
                )}
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedLead(l)} className="text-primary hover:underline text-left font-medium">
                        {l.full_name}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`tel:${l.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                        <Phone className="h-3 w-3" /> {l.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-foreground">{l.city || "—"}</td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <select
                          value={l.status}
                          onChange={(e) => handleStatusChange(l, e.target.value as LeadStatus)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[l.status]}`}
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[l.status]}`}>
                          {STATUS_LABELS[l.status]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <select
                          value={l.assigned_rep_id || ""}
                          onChange={(e) => handleUpdateField(l, "assigned_rep_id", e.target.value || null)}
                          className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground"
                        >
                          <option value="">Non assigné</option>
                          {SALES_REPS.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-foreground text-xs">{getRepName(l.assigned_rep_id)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <div className="flex items-center gap-1">
                        <span>{l.attempts_count}</span>
                        <button
                          onClick={() => handleIncrementAttempts(l)}
                          className="text-primary hover:bg-primary/10 rounded px-1 text-xs"
                          title="Ajouter une tentative"
                        >
                          +1
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">
                      {l.next_followup_date || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {l.created_at ? format(new Date(l.created_at), "d MMM", { locale: fr }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedLead(l)} className="text-xs text-primary hover:underline">
                          Voir
                        </button>
                        {canDelete && (
                          <button onClick={() => setDeleteConfirm(l.id)} className="text-xs text-muted-foreground hover:text-destructive ml-2">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <Dialog open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
        <DialogContent className="sm:max-w-[560px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Fiche Lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <LeadDetailPanel
              lead={selectedLead}
              canEdit={canEdit}
              canDelete={canDelete}
              onUpdate={async (field, value) => {
                await handleUpdateField(selectedLead, field, value);
              }}
              onStatusChange={(s) => handleStatusChange(selectedLead, s)}
              onIncrement={() => handleIncrementAttempts(selectedLead)}
              onDelete={() => setDeleteConfirm(selectedLead.id)}
              onClose={() => setSelectedLead(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* New Lead Form */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nouveau Lead Marketing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground">Nom complet *</label>
              <Input value={newForm.full_name} onChange={(e) => setNewForm({ ...newForm, full_name: e.target.value })} placeholder="Nom complet" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Téléphone *</label>
              <Input value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} placeholder="(514) 555-0000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Adresse</label>
                <Input value={newForm.address} onChange={(e) => setNewForm({ ...newForm, address: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ville</label>
                <Input value={newForm.city} onChange={(e) => setNewForm({ ...newForm, city: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Entretoit</label>
              <select
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                value={newForm.has_attic}
                onChange={(e) => setNewForm({ ...newForm, has_attic: e.target.value })}
              >
                <option value="">Non renseigné</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notes</label>
              <Textarea value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewForm(false)}>Annuler</Button>
              <Button
                onClick={handleCreateLead}
                disabled={!newForm.full_name.trim() || !newForm.phone.trim() || createLead.isPending}
              >
                {createLead.isPending ? "Création..." : "Créer le lead"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <Dialog open={!!bookingLead} onOpenChange={(o) => !o && setBookingLead(null)}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Planifier un rendez-vous</DialogTitle>
          </DialogHeader>
          {bookingLead && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Convertir <span className="text-foreground font-medium">{bookingLead.full_name}</span> en RDV
              </p>
              <div>
                <label className="text-xs text-muted-foreground">Date *</label>
                <Input type="date" value={bookForm.date} onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Heure *</label>
                <Input type="time" value={bookForm.time} onChange={(e) => setBookForm({ ...bookForm, time: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Représentant *</label>
                <select
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  value={bookForm.repId}
                  onChange={(e) => setBookForm({ ...bookForm, repId: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {SALES_REPS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBookingLead(null)}>Annuler</Button>
                <Button onClick={handleBookAppointment} disabled={!bookForm.date || !bookForm.repId}>
                  Confirmer le RDV
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce lead ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// --- Detail Panel Sub-component ---

interface LeadDetailPanelProps {
  lead: MarketingLead;
  canEdit: boolean;
  canDelete: boolean;
  onUpdate: (field: string, value: any) => Promise<void>;
  onStatusChange: (s: LeadStatus) => void;
  onIncrement: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const LeadDetailPanel = ({
  lead,
  canEdit,
  canDelete,
  onUpdate,
  onStatusChange,
  onIncrement,
  onDelete,
}: LeadDetailPanelProps) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState(lead.notes || "");

  return (
    <div className="space-y-5 mt-2">
      {/* Name + Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{lead.full_name}</h2>
        {canEdit ? (
          <select
            value={lead.status}
            onChange={(e) => onStatusChange(e.target.value as LeadStatus)}
            className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[lead.status]}`}
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        ) : (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
            {STATUS_LABELS[lead.status]}
          </span>
        )}
      </div>

      {/* Info Grid */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Informations</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-sm">
            <span className="text-muted-foreground text-xs block">Téléphone</span>
            <a href={`tel:${lead.phone}`} className="text-primary hover:underline flex items-center gap-1">
              <Phone className="h-3 w-3" /> {lead.phone}
            </a>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground text-xs block">Source</span>
            <span className="text-foreground">{lead.source}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground text-xs block">Adresse</span>
            <span className="text-foreground">{lead.address || "—"}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground text-xs block">Ville</span>
            <span className="text-foreground">{lead.city || "—"}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground text-xs block">Entretoit</span>
            <span className="text-foreground">{lead.has_attic || "—"}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground text-xs block">Rep assigné</span>
            {canEdit ? (
              <select
                value={lead.assigned_rep_id || ""}
                onChange={(e) => onUpdate("assigned_rep_id", e.target.value || null)}
                className="bg-secondary border border-border rounded px-2 py-0.5 text-xs text-foreground"
              >
                <option value="">Non assigné</option>
                {SALES_REPS.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-foreground">{getRepName(lead.assigned_rep_id)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Attempts & Follow-up */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Suivi</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-muted-foreground text-xs block">Tentatives</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-bold text-lg">{lead.attempts_count}</span>
              <button
                onClick={onIncrement}
                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20"
              >
                +1 Appel
              </button>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Dernier contact</span>
            <span className="text-foreground text-sm">
              {lead.last_contact_date
                ? format(new Date(lead.last_contact_date), "d MMM yyyy HH:mm", { locale: fr })
                : "—"}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground text-xs block mb-1">Prochain suivi</span>
            {canEdit ? (
              <Input
                type="date"
                value={lead.next_followup_date || ""}
                onChange={(e) => onUpdate("next_followup_date", e.target.value || null)}
                className="h-8 text-sm"
              />
            ) : (
              <span className="text-foreground text-sm">{lead.next_followup_date || "—"}</span>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Notes</h3>
          {canEdit && !editingNotes && (
            <button
              onClick={() => { setNotesInput(lead.notes || ""); setEditingNotes(true); }}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Modifier
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <Textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)} rows={4} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditingNotes(false)}>Annuler</Button>
              <Button
                size="sm"
                onClick={async () => {
                  await onUpdate("notes", notesInput);
                  setEditingNotes(false);
                }}
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3">
            {lead.notes || <span className="text-muted-foreground italic">Aucune note</span>}
          </p>
        )}
      </div>

      {/* Converted info */}
      {lead.converted_appointment_id && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-xs text-green-400 flex items-center gap-1">
            <CalendarCheck className="h-3 w-3" />
            Converti en rendez-vous
          </p>
        </div>
      )}

      {/* Photos */}
      <ClientPhotosSection clientPhone={lead.phone} clientName={lead.full_name} />

      {/* Delete */}
      {canDelete && (
        <div className="flex justify-end">
          <button onClick={onDelete} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketingLeadsPage;
