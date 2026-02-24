import { useMemo, useState, useCallback } from "react";
import { useAuth } from "@/store/crm-store";
import { SALES_REPS, HOT_CALL_PHASES, HOT_CALL_FEEDBACKS, HotCallPhase, HotCallFeedback, Appointment } from "@/data/crm-data";
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
  Lock,
  Unlock,
  Loader2,
  Timer,
  Hand,
  Users,
} from "lucide-react";
import {
  useHotCallsQuery,
  useClaimHotCall,
  useReleaseHotCall,
  useUpdateHotCall,
  useDeleteHotCall,
  useAddHotCallNote,
  DbHotCall,
  isAvailable,
  isClaimedBy,
} from "@/hooks/useHotCalls";

const DEFAULT_TAGS = ["Callback", "Client chaud", "Client froid", "Budget", "À rappeler matin", "À rappeler soir"];

type ViewTab = "pool" | "mine" | "all";

const HotCallsPage = () => {
  const { role, currentRepId } = useAuth();
  const canManage = role === "proprietaire" || role === "gestionnaire";
  const isRep = role === "representant";

  const { data: hotCalls = [], isLoading } = useHotCallsQuery();
  const claimMut = useClaimHotCall();
  const releaseMut = useReleaseHotCall();
  const updateMut = useUpdateHotCall();
  const deleteMut = useDeleteHotCall();
  const addNoteMut = useAddHotCallNote();

  const [tab, setTab] = useState<ViewTab>(isRep ? "pool" : "all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fiche client modal
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedHotCallForFiche, setSelectedHotCallForFiche] = useState<DbHotCall | null>(null);

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

  // Reassign popup (manager)
  const [reassignId, setReassignId] = useState<string | null>(null);
  const [reassignRepId, setReassignRepId] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const isRescheduleeFeedback = postCallFeedback === "Reschedule requested";

  // Pool = available leads
  const poolCalls = useMemo(() => hotCalls.filter(isAvailable), [hotCalls]);
  // Mine = claimed by current rep with valid lock
  const myCalls = useMemo(() => hotCalls.filter((h) => isClaimedBy(h, currentRepId || "")), [hotCalls, currentRepId]);
  // All = everything (for manager)
  const allCalls = hotCalls;

  const baseCalls = useMemo(() => {
    if (tab === "pool") return poolCalls;
    if (tab === "mine") return myCalls;
    return allCalls;
  }, [tab, poolCalls, myCalls, allCalls]);

  const filtered = useMemo(() => {
    return baseCalls.filter((h) => {
      if (phaseFilter !== "all" && h.phase !== phaseFilter) return false;
      if (repFilter !== "all" && h.assigned_to_user_id !== repFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !h.full_name.toLowerCase().includes(q) &&
          !h.phone.includes(q) &&
          !h.address.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [baseCalls, phaseFilter, repFilter, search]);

  // Stats
  const weekStats = useMemo(() => {
    const startOfWeek = (() => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().split("T")[0];
    })();
    const weekCalls = hotCalls.filter((h) => h.created_at >= startOfWeek);
    const rebooked = hotCalls.filter(
      (h) => h.phase === "Re-booké" && h.last_contact_date && h.last_contact_date >= startOfWeek
    );
    const totalAttempts = hotCalls.reduce((s, h) => s + h.attempts, 0);
    const avgAttempts = hotCalls.length > 0 ? (totalAttempts / hotCalls.length).toFixed(1) : "0";
    const recoveryRate = weekCalls.length > 0 ? Math.round((rebooked.length / weekCalls.length) * 100) : 0;
    return { total: weekCalls.length, rebooked: rebooked.length, recoveryRate, avgAttempts, pool: poolCalls.length, mine: myCalls.length };
  }, [hotCalls, poolCalls.length, myCalls.length]);

  const getRepName = (repId: string | null) => {
    if (!repId) return "—";
    return SALES_REPS.find((r) => r.id === repId)?.name || repId;
  };

  const phaseColors: Record<string, string> = {
    "À rappeler": "bg-warning/20 text-warning",
    "En cours": "bg-info/20 text-info",
    "Re-booké": "bg-primary/20 text-primary",
    "Converti": "bg-green-500/20 text-green-400",
    "Perdu": "bg-destructive/20 text-destructive",
  };

  const feedbackColors: Record<string, string> = {
    "No answer": "bg-warning/20 text-warning",
    "Call back later": "bg-info/20 text-info",
    "Reschedule requested": "bg-primary/20 text-primary",
    "Not interested": "bg-muted text-muted-foreground",
    "Follow-up 3 months": "bg-accent/20 text-accent-foreground",
    "Follow-up 6 months": "bg-accent/20 text-accent-foreground",
    "Follow-up 9 months": "bg-accent/20 text-accent-foreground",
    "Follow-up 12 months": "bg-accent/20 text-accent-foreground",
  };

  // Lock time remaining
  const getLockRemaining = (hc: DbHotCall): string | null => {
    if (!hc.lock_expires_at) return null;
    const diff = new Date(hc.lock_expires_at).getTime() - Date.now();
    if (diff <= 0) return null;
    const mins = Math.ceil(diff / 60000);
    return `${mins} min`;
  };

  // Claim a lead
  const handleClaim = useCallback(async (id: string) => {
    if (!currentRepId) return;
    try {
      await claimMut.mutateAsync({ id, repId: currentRepId });
      toast.success("Lead pris avec succès !");
    } catch (err: any) {
      if (err.message === "ALREADY_CLAIMED") {
        toast.error("Ce lead est déjà pris par un autre rep.");
      } else {
        toast.error("Erreur lors de la prise du lead.");
      }
    }
  }, [claimMut, currentRepId]);

  // Release a lead
  const handleRelease = useCallback(async (id: string) => {
    try {
      await releaseMut.mutateAsync(id);
      toast.success("Lead relâché dans la pool.");
    } catch {
      toast.error("Erreur lors du relâchement.");
    }
  }, [releaseMut]);

  // Extend lock on action
  const doAction = useCallback(async (id: string, updates: Record<string, any>) => {
    try {
      await updateMut.mutateAsync({ id, updates, extendLock: true });
    } catch {
      toast.error("Erreur.");
    }
  }, [updateMut]);

  const hotCallToAppointment = (hc: DbHotCall): Appointment => ({
    id: hc.id,
    fullName: hc.full_name,
    phone: hc.phone,
    address: hc.address,
    city: hc.city,
    origin: hc.origin || undefined,
    date: hc.last_contact_date || "",
    time: "",
    repId: hc.assigned_to_user_id || "",
    preQual1: "",
    preQual2: "",
    notes: hc.notes || "",
    status: "En attente",
    source: (hc.source as "Door-to-door" | "Referral") || "Door-to-door",
    smsScheduled: false,
    createdAt: hc.created_at,
    statusLog: [],
  });

  const handleOpenFiche = (hc: DbHotCall) => {
    setSelectedAppt(hotCallToAppointment(hc));
    setSelectedHotCallForFiche(hc);
  };

  const openGoogleMaps = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const openPostCallPopup = (hc: DbHotCall) => {
    setPostCallId(hc.id);
    setPostCallFeedback((hc.last_feedback as HotCallFeedback) || "No answer");
    setPostCallNote("");
    setPostCallDate(hc.follow_up_date || today);
    setPostCallRescheduleDate("");
    setPostCallRescheduleTime("09:00");
  };

  const submitPostCall = async () => {
    if (!postCallId) return;
    const repId = currentRepId || "rep1";

    try {
      // Update the hot call
      await updateMut.mutateAsync({
        id: postCallId,
        updates: {
          last_feedback: postCallFeedback,
          status: postCallFeedback,
          attempts: (hotCalls.find((h) => h.id === postCallId)?.attempts || 0) + 1,
          last_contact_date: today,
          follow_up_date: postCallDate || undefined,
          notes: postCallNote || undefined,
        },
        extendLock: true,
      });

      // Add note to history
      if (postCallNote) {
        await addNoteMut.mutateAsync({
          hot_call_id: postCallId,
          user_id: repId,
          note: postCallNote,
          call_feedback: postCallFeedback,
        });
      }

      toast.success("Appel enregistré");
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
    setPostCallId(null);
  };

  const handleReassign = async () => {
    if (!reassignId || !reassignRepId) return;
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    try {
      await updateMut.mutateAsync({
        id: reassignId,
        updates: {
          assigned_to_user_id: reassignRepId,
          locked_at: now,
          lock_expires_at: expires,
          last_action_at: now,
        },
      });
      toast.success(`Lead assigné à ${getRepName(reassignRepId)}`);
    } catch {
      toast.error("Erreur lors de la réassignation.");
    }
    setReassignId(null);
  };

  const handleEditDate = async () => {
    if (!editDateId || !editDateValue) return;
    await doAction(editDateId, { follow_up_date: editDateValue });
    toast.success("Date de relance modifiée");
    setEditDateId(null);
    setEditDateValue("");
  };

  const addTag = async (hcId: string, tag: string) => {
    const hc = hotCalls.find((h) => h.id === hcId);
    if (!hc || hc.tags.includes(tag)) return;
    await doAction(hcId, { tags: [...hc.tags, tag] });
  };

  const removeTag = async (hcId: string, tag: string) => {
    const hc = hotCalls.find((h) => h.id === hcId);
    if (!hc) return;
    await doAction(hcId, { tags: hc.tags.filter((t) => t !== tag) });
  };

  const canSavePostCall = isRescheduleeFeedback ? !!postCallRescheduleDate : true;

  // Can the current user act on this hot call?
  const canActOn = (hc: DbHotCall) => {
    if (canManage) return true;
    return isClaimedBy(hc, currentRepId || "");
  };

  const tabBtnClass = (t: ViewTab) =>
    `px-4 py-2 text-sm rounded-lg transition-colors ${
      tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    }`;

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
            { label: "Pool disponible", sub: "Leads à prendre", value: weekStats.pool, icon: Users, color: "text-info" },
            { label: "Mes Hot Calls", sub: "En cours", value: weekStats.mine, icon: Lock, color: "text-primary" },
            { label: "Récupération", sub: "Taux de conversion", value: `${weekStats.recoveryRate}%`, icon: TrendingUp, color: "text-warning" },
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

        {/* Tab toggle + filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            <button onClick={() => setTab("pool")} className={tabBtnClass("pool")}>
              <span className="flex items-center gap-1.5"><Hand className="h-3.5 w-3.5" /> Pool ({poolCalls.length})</span>
            </button>
            <button onClick={() => setTab("mine")} className={tabBtnClass("mine")}>
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Mes Hot Calls ({myCalls.length})</span>
            </button>
            {canManage && (
              <button onClick={() => setTab("all")} className={tabBtnClass("all")}>
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Tous ({allCalls.length})</span>
              </button>
            )}
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

          {canManage && tab === "all" && (
            <select className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" value={repFilter} onChange={(e) => setRepFilter(e.target.value)}>
              <option value="all">Tous les reps</option>
              {SALES_REPS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Nom", "Téléphone", "Adresse", "Phase", "Feedback", "Tentatives", "Relance",
                      ...(tab !== "pool" ? ["Assigné à"] : []),
                      ...(tab === "mine" ? ["Lock"] : []),
                      "Tags", "Actions"
                    ].map((h) => (
                      <th key={h} className="text-left px-3 py-3 text-muted-foreground font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h) => {
                    const claimed = !isAvailable(h);
                    const isMine = isClaimedBy(h, currentRepId || "");
                    const lockRemaining = getLockRemaining(h);
                    const editable = canActOn(h);

                    return (
                      <tr key={h.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${isMine ? "bg-primary/5" : ""}`}>
                        {/* Nom */}
                        <td className="px-3 py-3 font-medium whitespace-nowrap">
                          <button onClick={() => handleOpenFiche(h)} className="text-primary hover:underline text-left">
                            {h.full_name}
                          </button>
                        </td>

                        {/* Téléphone */}
                        <td className="px-3 py-3">
                          <a
                            href={`tel:${h.phone.replace(/\D/g, "")}`}
                            onClick={() => { if (isMine || canManage) setTimeout(() => openPostCallPopup(h), 500); }}
                            className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap"
                          >
                            <Phone className="h-3 w-3" /> {h.phone}
                          </a>
                        </td>

                        {/* Adresse */}
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
                          {editable ? (
                            <select
                              value={h.phase}
                              onChange={(e) => doAction(h.id, { phase: e.target.value })}
                              className={`px-2 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer ${phaseColors[h.phase] || "bg-muted text-muted-foreground"}`}
                            >
                              {HOT_CALL_PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${phaseColors[h.phase] || "bg-muted text-muted-foreground"}`}>
                              {h.phase}
                            </span>
                          )}
                        </td>

                        {/* Feedback */}
                        <td className="px-3 py-3">
                          {editable ? (
                            <select
                              value={h.last_feedback}
                              onChange={(e) => doAction(h.id, { last_feedback: e.target.value, status: e.target.value })}
                              className={`px-2 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer ${feedbackColors[h.last_feedback] || "bg-muted text-muted-foreground"}`}
                            >
                              {HOT_CALL_FEEDBACKS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${feedbackColors[h.last_feedback] || "bg-muted text-muted-foreground"}`}>
                              {h.last_feedback}
                            </span>
                          )}
                        </td>

                        {/* Tentatives */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {canManage && h.attempts > 0 && (
                              <button
                                onClick={() => doAction(h.id, { attempts: h.attempts - 1 })}
                                className="w-5 h-5 rounded bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                            )}
                            <span className="text-sm font-bold text-foreground min-w-[16px] text-center">{h.attempts}</span>
                            {editable && (
                              <button
                                onClick={() => doAction(h.id, { attempts: h.attempts + 1 })}
                                className="w-5 h-5 rounded bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary flex items-center justify-center transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Relance */}
                        <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">
                          {h.follow_up_date || "—"}
                        </td>

                        {/* Assigné à */}
                        {tab !== "pool" && (
                          <td className="px-3 py-3">
                            {canManage ? (
                              <button
                                onClick={() => { setReassignId(h.id); setReassignRepId(h.assigned_to_user_id || ""); }}
                                className="text-xs text-foreground hover:text-primary hover:underline"
                              >
                                {getRepName(h.assigned_to_user_id)}
                              </button>
                            ) : (
                              <span className="text-xs text-foreground">{getRepName(h.assigned_to_user_id)}</span>
                            )}
                          </td>
                        )}

                        {/* Lock timer */}
                        {tab === "mine" && (
                          <td className="px-3 py-3">
                            {lockRemaining ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary">
                                <Timer className="h-3 w-3" /> {lockRemaining}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                        )}

                        {/* Tags */}
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1 items-center max-w-[150px]">
                            {h.tags.map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/20 text-accent-foreground">
                                {tag}
                                {editable && (
                                  <button onClick={() => removeTag(h.id, tag)} className="hover:text-destructive ml-0.5">
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </span>
                            ))}
                            {editable && (
                              <div className="relative">
                                <button
                                  onClick={() => setEditingTagsId(editingTagsId === h.id ? null : h.id)}
                                  className="w-5 h-5 rounded bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary flex items-center justify-center transition-colors"
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
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {/* Pool view: Claim button */}
                            {tab === "pool" && (
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleClaim(h.id)}
                                disabled={claimMut.isPending}
                              >
                                <Hand className="h-3 w-3" /> Prendre
                              </Button>
                            )}

                            {/* Mine view: Release button */}
                            {tab === "mine" && isMine && (
                              <button
                                onClick={() => handleRelease(h.id)}
                                className="p-1.5 rounded hover:bg-warning/20 text-muted-foreground hover:text-warning transition-colors"
                                title="Relâcher dans la pool"
                              >
                                <Unlock className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {editable && (
                              <>
                                <button
                                  onClick={() => { setEditDateId(h.id); setEditDateValue(h.follow_up_date || ""); }}
                                  className="p-1.5 rounded hover:bg-info/20 text-muted-foreground hover:text-info transition-colors"
                                  title="Modifier date relance"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}

                            {canManage && tab === "all" && (
                              <button
                                onClick={() => { setReassignId(h.id); setReassignRepId(h.assigned_to_user_id || ""); }}
                                className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                title="Réassigner"
                              >
                                <Users className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {canManage && (
                              <>
                                {deleteConfirm === h.id ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={async () => { await deleteMut.mutateAsync(h.id); setDeleteConfirm(null); toast.success("Supprimé"); }} className="text-xs text-destructive font-medium">Oui</button>
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
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">
                        {tab === "pool"
                          ? "Aucun lead disponible dans la pool"
                          : tab === "mine"
                          ? "Aucun hot call assigné. Prenez un lead dans la Pool !"
                          : "Aucun hot call trouvé"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Fiche Client Modal */}
      <FicheClient
        appointment={selectedAppt}
        hotCall={selectedHotCallForFiche ? {
          id: selectedHotCallForFiche.id,
          fullName: selectedHotCallForFiche.full_name,
          phone: selectedHotCallForFiche.phone,
          address: selectedHotCallForFiche.address,
          city: selectedHotCallForFiche.city,
          source: (selectedHotCallForFiche.source as "Door-to-door" | "Referral") || "Door-to-door",
          repId: selectedHotCallForFiche.assigned_to_user_id || "",
          status: selectedHotCallForFiche.status as any,
          phase: selectedHotCallForFiche.phase as any,
          lastFeedback: selectedHotCallForFiche.last_feedback as any,
          attempts: selectedHotCallForFiche.attempts,
          lastContactDate: selectedHotCallForFiche.last_contact_date || "",
          followUpDate: selectedHotCallForFiche.follow_up_date || "",
          notes: selectedHotCallForFiche.notes || "",
          createdAt: selectedHotCallForFiche.created_at,
          tags: selectedHotCallForFiche.tags || [],
          callHistory: [],
        } : undefined}
        open={!!selectedAppt}
        onOpenChange={(o) => { if (!o) { setSelectedAppt(null); setSelectedHotCallForFiche(null); } }}
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
              <Button onClick={handleEditDate} className="flex-1">Enregistrer</Button>
              <Button variant="outline" onClick={() => setEditDateId(null)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign Popup (Manager) */}
      <Dialog open={!!reassignId} onOpenChange={(o) => { if (!o) setReassignId(null); }}>
        <DialogContent className="sm:max-w-[350px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Réassigner le lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Représentant</label>
              <select
                value={reassignRepId}
                onChange={(e) => setReassignRepId(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">— Aucun (retour pool) —</option>
                {SALES_REPS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={async () => {
                if (!reassignId) return;
                if (!reassignRepId) {
                  await handleRelease(reassignId);
                } else {
                  await handleReassign();
                }
                setReassignId(null);
              }} className="flex-1">
                Confirmer
              </Button>
              <Button variant="outline" onClick={() => setReassignId(null)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HotCallsPage;
