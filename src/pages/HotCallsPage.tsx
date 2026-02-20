import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS, HOT_CALL_PHASES, HOT_CALL_FEEDBACKS, HotCallStatus, HotCallPhase, HotCallFeedback, HotCall, Appointment } from "@/data/crm-data";
import { toast } from "sonner";
import FicheClient from "@/components/FicheClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Search,
  Flame,
  CalendarCheck,
  TrendingUp,
  RotateCcw,
  Trash2,
  Plus,
  Minus,
  X,
  Tag,
  MapPin,
  CalendarPlus,
  Pencil,
} from "lucide-react";

const DEFAULT_TAGS = ["Callback", "Client chaud", "Client froid", "Budget", "À rappeler matin", "À rappeler soir"];

const HotCallsPage = () => {
  const {
    hotCalls, appointments,
    updateHotCallPhase, updateHotCallFeedback,
    deleteHotCall, incrementHotCallAttempts, decrementHotCallAttempts,
    updateHotCallFollowUpDate, updateHotCallTags,
    logCallAndUpdate, reassignHotCall, rebookHotCall,
    rescheduleHotCall,
    updateHotCallNotes,
  } = useCrm();
  const { role, currentRepId } = useAuth();

  const [view, setView] = useState<"all" | "today">("today");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fiche client modal
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedHotCall, setSelectedHotCall] = useState<HotCall | null>(null);

  // Post-call popup
  const [postCallId, setPostCallId] = useState<string | null>(null);
  const [postCallFeedback, setPostCallFeedback] = useState<HotCallFeedback>("No answer");
  const [postCallNote, setPostCallNote] = useState("");
  const [postCallDate, setPostCallDate] = useState("");
  const [postCallRescheduleDate, setPostCallRescheduleDate] = useState("");
  const [postCallRescheduleTime, setPostCallRescheduleTime] = useState("09:00");

  // Rebook popup
  const [rebookId, setRebookId] = useState<string | null>(null);
  const [rebookDate, setRebookDate] = useState("");
  const [rebookTime, setRebookTime] = useState("09:00");

  // Edit follow-up date popup
  const [editDateId, setEditDateId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState("");

  // Tag editing
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const canManage = role === "proprietaire" || role === "gestionnaire";

  const isRescheduleeFeedback = postCallFeedback === "Reschedule requested";

  const hotCallToAppointment = (hc: HotCall): Appointment => {
    const original = hc.originalAppointmentId
      ? appointments.find((a) => a.id === hc.originalAppointmentId)
      : undefined;
    return {
      id: hc.id,
      fullName: hc.fullName,
      phone: hc.phone,
      address: hc.address,
      city: hc.city,
      origin: hc.origin || original?.origin,
      date: hc.lastContactDate,
      time: "",
      repId: hc.repId,
      preQual1: original?.preQual1 || "",
      preQual2: original?.preQual2 || "",
      notes: hc.notes,
      status: "En attente",
      source: hc.source,
      smsScheduled: false,
      createdAt: hc.createdAt,
      statusLog: [],
    };
  };

  const visibleCalls = useMemo(() => {
    if (role === "representant") return hotCalls.filter((h) => h.repId === currentRepId);
    return hotCalls;
  }, [hotCalls, role, currentRepId]);

  const todayCalls = useMemo(
    () =>
      visibleCalls.filter(
        (h) =>
          h.followUpDate === today ||
          (h.lastFeedback === "No answer" && h.lastContactDate === yesterday) ||
          (h.lastFeedback === "Call back later" && h.followUpDate <= today)
      ),
    [visibleCalls, today, yesterday]
  );

  const displayCalls = view === "today" ? todayCalls : visibleCalls;

  const filtered = useMemo(() => {
    return displayCalls.filter((h) => {
      if (phaseFilter !== "all" && h.phase !== phaseFilter) return false;
      if (repFilter !== "all" && h.repId !== repFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!h.fullName.toLowerCase().includes(q) && !h.phone.includes(q) && !h.address.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [displayCalls, phaseFilter, repFilter, search]);

  const startOfWeek = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().split("T")[0];
  }, []);

  const weekStats = useMemo(() => {
    const weekCalls = visibleCalls.filter((h) => h.createdAt >= startOfWeek);
    const rebooked = visibleCalls.filter((h) => h.phase === "Re-booké" && h.lastContactDate >= startOfWeek);
    const totalAttempts = visibleCalls.reduce((s, h) => s + h.attempts, 0);
    const avgAttempts = visibleCalls.length > 0 ? (totalAttempts / visibleCalls.length).toFixed(1) : "0";
    const recoveryRate = weekCalls.length > 0 ? Math.round((rebooked.length / weekCalls.length) * 100) : 0;
    return { total: weekCalls.length, rebooked: rebooked.length, recoveryRate, avgAttempts };
  }, [visibleCalls, startOfWeek]);

  const getRepName = (repId: string) => SALES_REPS.find((r) => r.id === repId)?.name || repId;

  const phaseColors: Record<HotCallPhase, string> = {
    "À rappeler": "bg-warning/20 text-warning",
    "En cours": "bg-info/20 text-info",
    "Re-booké": "bg-primary/20 text-primary",
    "Converti": "bg-success/20 text-success",
    "Perdu": "bg-destructive/20 text-destructive",
  };

  const feedbackColors: Record<HotCallFeedback, string> = {
    "No answer": "bg-warning/20 text-warning",
    "Call back later": "bg-info/20 text-info",
    "Reschedule requested": "bg-primary/20 text-primary",
    "Not interested": "bg-muted text-muted-foreground",
    "Follow-up 3 months": "bg-accent/20 text-accent-foreground",
    "Follow-up 6 months": "bg-accent/20 text-accent-foreground",
    "Follow-up 9 months": "bg-accent/20 text-accent-foreground",
    "Follow-up 12 months": "bg-accent/20 text-accent-foreground",
  };

  const openPostCallPopup = (hcId: string) => {
    const hc = hotCalls.find((h) => h.id === hcId);
    setPostCallId(hcId);
    setPostCallFeedback(hc?.lastFeedback || "No answer");
    setPostCallNote("");
    setPostCallDate(hc?.followUpDate || today);
    setPostCallRescheduleDate("");
    setPostCallRescheduleTime("09:00");
  };

  const submitPostCall = () => {
    if (!postCallId) return;
    const repId = currentRepId || "rep1";

    if (isRescheduleeFeedback && postCallRescheduleDate) {
      // Reschedule: update existing RDV date/time and remove from hot calls
      rescheduleHotCall(postCallId, postCallRescheduleDate, postCallRescheduleTime);
      toast.success("RDV replanifié avec succès");
    } else {
      logCallAndUpdate(postCallId, postCallFeedback as HotCallStatus, postCallNote, postCallDate, repId);
      toast.success("Appel enregistré");
    }
    setPostCallId(null);
  };

  const handleOpenFiche = (hc: HotCall) => {
    setSelectedAppt(hotCallToAppointment(hc));
    setSelectedHotCall(hc);
  };

  const openGoogleMaps = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const handleRebook = () => {
    if (!rebookId || !rebookDate) return;
    rebookHotCall(rebookId, rebookDate, rebookTime);
    toast.success("RDV créé avec succès");
    setRebookId(null);
    setRebookDate("");
    setRebookTime("09:00");
  };

  const handleEditDate = () => {
    if (!editDateId || !editDateValue) return;
    updateHotCallFollowUpDate(editDateId, editDateValue);
    toast.success("Date de relance modifiée");
    setEditDateId(null);
    setEditDateValue("");
  };

  const addTag = (hcId: string, tag: string) => {
    const hc = hotCalls.find((h) => h.id === hcId);
    if (!hc || hc.tags.includes(tag)) return;
    updateHotCallTags(hcId, [...hc.tags, tag]);
  };

  const removeTag = (hcId: string, tag: string) => {
    const hc = hotCalls.find((h) => h.id === hcId);
    if (!hc) return;
    updateHotCallTags(hcId, hc.tags.filter((t) => t !== tag));
  };

  const canSavePostCall = isRescheduleeFeedback ? !!postCallRescheduleDate : true;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Flame className="h-6 w-6 text-destructive" />
          <h1 className="text-xl font-bold text-foreground">Hot Calls</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Hot calls", sub: "Cette semaine", value: weekStats.total, icon: Flame, color: "text-destructive" },
            { label: "Re-bookés", sub: "Cette semaine", value: weekStats.rebooked, icon: CalendarCheck, color: "text-primary" },
            { label: "Récupération", sub: "Taux de conversion", value: `${weekStats.recoveryRate}%`, icon: TrendingUp, color: "text-info" },
            { label: "Tentatives", sub: "Moyenne par lead", value: weekStats.avgAttempts, icon: RotateCcw, color: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <span className="text-[10px] text-muted-foreground/70">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* View toggle + filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {(["today", "all"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  view === v ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {v === "today" ? "Appels du jour" : "Tous"}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Rechercher nom, tél, adresse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)}>
            <option value="all">Toutes les phases</option>
            {HOT_CALL_PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          {canManage && (
            <select className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={repFilter} onChange={(e) => setRepFilter(e.target.value)}>
              <option value="all">Tous les reps</option>
              {SALES_REPS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Nom", "Téléphone", "Adresse", "Phase", "Dernier feedback", "Tentatives", "Relance", "Assigné à", "Tags", "Actions"].map((h) => (
                    <th key={h} className="text-left px-3 py-3 text-muted-foreground font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr key={h.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    {/* Nom */}
                    <td className="px-3 py-3 font-medium whitespace-nowrap">
                      <button onClick={() => handleOpenFiche(h)} className="text-primary hover:underline text-left">
                        {h.fullName}
                      </button>
                    </td>

                    {/* Téléphone */}
                    <td className="px-3 py-3">
                      <a
                        href={`tel:${h.phone.replace(/\D/g, "")}`}
                        onClick={() => setTimeout(() => openPostCallPopup(h.id), 500)}
                        className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap"
                      >
                        <Phone className="h-3 w-3" /> {h.phone}
                      </a>
                    </td>

                    {/* Adresse - clickable Google Maps */}
                    <td className="px-3 py-3">
                      <button
                        onClick={() => openGoogleMaps(h.address, h.city)}
                        className="flex items-center gap-1 text-info hover:underline text-left text-xs max-w-[200px] truncate"
                        title={`${h.address}, ${h.city}`}
                      >
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{h.address}</span>
                      </button>
                    </td>

                    {/* Phase */}
                    <td className="px-3 py-3">
                      {canManage ? (
                        <select
                          value={h.phase}
                          onChange={(e) => updateHotCallPhase(h.id, e.target.value as HotCallPhase)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer ${phaseColors[h.phase]}`}
                        >
                          {HOT_CALL_PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${phaseColors[h.phase]}`}>
                          {h.phase}
                        </span>
                      )}
                    </td>

                    {/* Dernier feedback */}
                    <td className="px-3 py-3">
                      <select
                        value={h.lastFeedback}
                        onChange={(e) => updateHotCallFeedback(h.id, e.target.value as HotCallFeedback)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer ${feedbackColors[h.lastFeedback]}`}
                      >
                        {HOT_CALL_FEEDBACKS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </td>

                    {/* Tentatives */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {canManage && h.attempts > 0 && (
                          <button
                            onClick={() => decrementHotCallAttempts(h.id)}
                            className="w-5 h-5 rounded bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                            title="-1 tentative"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        )}
                        <span className="text-sm font-bold text-foreground min-w-[16px] text-center">{h.attempts}</span>
                        <button
                          onClick={() => incrementHotCallAttempts(h.id)}
                          className="w-5 h-5 rounded bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary flex items-center justify-center transition-colors"
                          title="+1 tentative"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    {/* Prochaine relance */}
                    <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">
                      {h.followUpDate}
                    </td>

                    {/* Assigné à */}
                    <td className="px-3 py-3">
                      {canManage ? (
                        <select
                          value={h.repId}
                          onChange={(e) => reassignHotCall(h.id, e.target.value)}
                          className="bg-transparent border-none text-foreground text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
                        >
                          {SALES_REPS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-foreground text-xs">{getRepName(h.repId)}</span>
                      )}
                    </td>

                    {/* Tags */}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1 items-center max-w-[150px]">
                        {h.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/20 text-accent-foreground">
                            {tag}
                            <button onClick={() => removeTag(h.id, tag)} className="hover:text-destructive ml-0.5">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                        <div className="relative">
                          <button
                            onClick={() => setEditingTagsId(editingTagsId === h.id ? null : h.id)}
                            className="w-5 h-5 rounded bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary flex items-center justify-center transition-colors"
                            title="Ajouter un tag"
                          >
                            <Tag className="h-3 w-3" />
                          </button>
                          {editingTagsId === h.id && (
                            <div className="absolute top-7 right-0 z-50 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[160px] space-y-1">
                              {DEFAULT_TAGS.filter((t) => !h.tags.includes(t)).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => { addTag(h.id, t); setEditingTagsId(null); }}
                                  className="block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-secondary text-foreground"
                                >
                                  {t}
                                </button>
                              ))}
                              <div className="flex items-center gap-1 pt-1 border-t border-border mt-1">
                                <input
                                  value={newTagInput}
                                  onChange={(e) => setNewTagInput(e.target.value)}
                                  placeholder="Nouveau tag..."
                                  className="flex-1 bg-secondary border-none rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && newTagInput.trim()) {
                                      addTag(h.id, newTagInput.trim());
                                      setNewTagInput("");
                                      setEditingTagsId(null);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    if (newTagInput.trim()) {
                                      addTag(h.id, newTagInput.trim());
                                      setNewTagInput("");
                                      setEditingTagsId(null);
                                    }
                                  }}
                                  className="text-primary"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setRebookId(h.id); setRebookDate(today); setRebookTime("09:00"); }}
                          className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                          title="Rebook RDV"
                        >
                          <CalendarPlus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditDateId(h.id); setEditDateValue(h.followUpDate); }}
                          className="p-1.5 rounded hover:bg-info/20 text-muted-foreground hover:text-info transition-colors"
                          title="Modifier date relance"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {canManage && (
                          <>
                            {deleteConfirm === h.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => { deleteHotCall(h.id); setDeleteConfirm(null); }} className="text-xs text-destructive font-medium">Oui</button>
                                <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground">Non</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(h.id)}
                                className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      {view === "today" ? "Aucun appel prévu aujourd'hui" : "Aucun hot call trouvé"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fiche Client Modal */}
      <FicheClient
        appointment={selectedAppt}
        hotCall={selectedHotCall}
        open={!!selectedAppt}
        onOpenChange={(o) => { if (!o) { setSelectedAppt(null); setSelectedHotCall(null); } }}
      />

      {/* Post-Call Popup */}
      <Dialog open={!!postCallId} onOpenChange={(o) => { if (!o) setPostCallId(null); }}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Résultat de l'appel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dernier feedback</label>
              <select
                value={postCallFeedback}
                onChange={(e) => setPostCallFeedback(e.target.value as HotCallFeedback)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                {HOT_CALL_FEEDBACKS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {isRescheduleeFeedback && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nouvelle date du rendez-vous <span className="text-destructive">*</span></label>
                  <input
                    type="date"
                    value={postCallRescheduleDate}
                    onChange={(e) => setPostCallRescheduleDate(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Heure du rendez-vous</label>
                  <input
                    type="time"
                    value={postCallRescheduleTime}
                    onChange={(e) => setPostCallRescheduleTime(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Note</label>
              <textarea
                value={postCallNote}
                onChange={(e) => setPostCallNote(e.target.value)}
                placeholder="Note rapide..."
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {!isRescheduleeFeedback && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Prochaine relance</label>
                <input
                  type="date"
                  value={postCallDate}
                  onChange={(e) => setPostCallDate(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={submitPostCall} className="flex-1" disabled={!canSavePostCall}>
                Enregistrer + 1 tentative
              </Button>
              <Button variant="outline" onClick={() => setPostCallId(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rebook RDV Popup */}
      <Dialog open={!!rebookId} onOpenChange={(o) => { if (!o) setRebookId(null); }}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Rebook RDV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date du RDV</label>
              <input
                type="date"
                value={rebookDate}
                onChange={(e) => setRebookDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Heure</label>
              <input
                type="time"
                value={rebookTime}
                onChange={(e) => setRebookTime(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleRebook} className="flex-1">
                Créer le RDV
              </Button>
              <Button variant="outline" onClick={() => setRebookId(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Follow-up Date Popup */}
      <Dialog open={!!editDateId} onOpenChange={(o) => { if (!o) setEditDateId(null); }}>
        <DialogContent className="sm:max-w-[350px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Modifier date de relance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nouvelle date</label>
              <input
                type="date"
                value={editDateValue}
                onChange={(e) => setEditDateValue(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleEditDate} className="flex-1">
                Enregistrer
              </Button>
              <Button variant="outline" onClick={() => setEditDateId(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HotCallsPage;
