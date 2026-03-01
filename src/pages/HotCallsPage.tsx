import { useMemo, useState, useCallback } from "react";
import { useAuth } from "@/store/crm-store";
import { useCrm } from "@/store/crm-store";
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
  TrendingUp,
  RotateCcw,
  Trash2,
  Plus,
  Minus,
  X,
  Tag,
  MapPin,
  Pencil,
  Lock,
  Unlock,
  Loader2,
  Timer,
  Hand,
  Users,
  CalendarPlus,
  XCircle,
  CalendarDays,
  CalendarRange,
  AlertTriangle,
} from "lucide-react";
import {
  useHotCallsQuery,
  useClaimHotCall,
  useReleaseHotCall,
  useUpdateHotCall,
  useDeleteHotCall,
  useAddHotCallNote,
  DbHotCall,
} from "@/hooks/useHotCalls";
import { HotCallPhase, HOT_CALL_PHASE_LABELS } from "@/domain/enums";
import { HOT_CALL_FEEDBACKS, type HotCallFeedback } from "@/data/crm-data";
import { can } from "@/lib/permissions/can";
import { getAtRiskToday, getAtRiskThisWeek, type AtRiskAppointment } from "@/lib/atRiskLogic";
import AtRiskAppointmentsSection from "@/components/hotcalls/AtRiskAppointmentsSection";

const DEFAULT_TAGS = ["Callback", "Client chaud", "Client froid", "Budget", "À rappeler matin", "À rappeler soir"];

type ViewTab = "pool" | "mine" | "today" | "week";

const CLAIM_DURATION_MS = 24 * 60 * 60 * 1000; // 24h

const HotCallsPage = () => {
  const { role, currentRepId } = useAuth();
  const canManage = can(role, "manage_hot_calls");
  const canReassign = can(role, "reassign_hot_calls");
  const isRep = role === "representant";

  // ─── Appointments (for at-risk detection) ─────────────────────────────────
  const storeAppointments = useCrm((s) => s.appointments);
  const allAppointments = useMemo((): AtRiskAppointment[] => {
    let appts = storeAppointments.map((a) => ({
      id: a.id,
      full_name: a.fullName,
      phone: a.phone,
      address: a.address,
      city: a.city,
      date: a.date,
      time: a.time,
      rep_id: a.repId,
      status: a.status,
      notes: a.notes,
      origin: a.origin,
    }));
    // Rep filter: only their own appointments
    if (isRep && currentRepId) {
      appts = appts.filter((a) => a.rep_id === currentRepId);
    }
    return appts;
  }, [storeAppointments, isRep, currentRepId]);

  const atRiskToday = useMemo(() => getAtRiskToday(allAppointments), [allAppointments]);
  const atRiskWeek = useMemo(() => getAtRiskThisWeek(allAppointments), [allAppointments]);

  const { data: hotCalls = [], isLoading } = useHotCallsQuery();
  const claimMut = useClaimHotCall();
  const releaseMut = useReleaseHotCall();
  const updateMut = useUpdateHotCall();
  const deleteMut = useDeleteHotCall();
  const addNoteMut = useAddHotCallNote();

  const [tab, setTab] = useState<ViewTab>("pool");
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fiche client modal
  const [selectedHotCallForFiche, setSelectedHotCallForFiche] = useState<DbHotCall | null>(null);

  // Post-call popup
  const [postCallId, setPostCallId] = useState<string | null>(null);
  const [postCallFeedback, setPostCallFeedback] = useState<HotCallFeedback>("No answer");
  const [postCallNote, setPostCallNote] = useState("");
  const [postCallDate, setPostCallDate] = useState("");

  // Schedule follow-up popup
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");

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

  // ─── Phase-based filtering ──────────────────────────────────────────────────

  const poolCalls = useMemo(
    () => hotCalls.filter((h) => h.phase === HotCallPhase.POOL || h.phase === "pool" || h.phase === "À rappeler"),
    [hotCalls]
  );

  const myCalls = useMemo(
    () =>
      hotCalls.filter(
        (h) =>
          h.assigned_to_user_id === currentRepId &&
          (h.phase === HotCallPhase.CLAIMED ||
            h.phase === "claimed" ||
            h.phase === HotCallPhase.SCHEDULED_FOLLOW_UP ||
            h.phase === "scheduled_follow_up")
      ),
    [hotCalls, currentRepId]
  );

  const todayCalls = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return hotCalls.filter((h) => h.follow_up_date === todayStr && h.phase !== HotCallPhase.CLOSED && h.phase !== "closed");
  }, [hotCalls]);

  const weekCalls = useMemo(() => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];
    return hotCalls.filter(
      (h) =>
        h.follow_up_date &&
        h.follow_up_date >= todayStr &&
        h.follow_up_date <= in7Days &&
        h.phase !== HotCallPhase.CLOSED &&
        h.phase !== "closed"
    );
  }, [hotCalls]);

  const baseCalls = useMemo(() => {
    if (tab === "pool") return poolCalls;
    if (tab === "mine") return myCalls;
    if (tab === "today") return todayCalls;
    return weekCalls;
  }, [tab, poolCalls, myCalls, todayCalls, weekCalls]);

  const filtered = useMemo(() => {
    if (!search) return baseCalls;
    const q = search.toLowerCase();
    return baseCalls.filter(
      (h) =>
        h.full_name.toLowerCase().includes(q) ||
        h.phone.includes(q) ||
        h.address.toLowerCase().includes(q)
    );
  }, [baseCalls, search]);

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalAttempts = hotCalls.reduce((s, h) => s + h.attempts, 0);
    const avgAttempts = hotCalls.length > 0 ? (totalAttempts / hotCalls.length).toFixed(1) : "0";
    const closedCount = hotCalls.filter(
      (h) => h.phase === HotCallPhase.CLOSED || h.phase === "closed"
    ).length;
    const recoveryRate = hotCalls.length > 0 ? Math.round((closedCount / hotCalls.length) * 100) : 0;
    return { pool: poolCalls.length, mine: myCalls.length, recoveryRate, avgAttempts };
  }, [hotCalls, poolCalls.length, myCalls.length]);

  // ─── Phase colors ─────────────────────────────────────────────────────────

  const phaseColors: Record<string, string> = {
    pool: "bg-warning/20 text-warning",
    "À rappeler": "bg-warning/20 text-warning",
    claimed: "bg-info/20 text-info",
    "En cours": "bg-info/20 text-info",
    scheduled_follow_up: "bg-primary/20 text-primary",
    "Re-booké": "bg-primary/20 text-primary",
    closed: "bg-muted text-muted-foreground",
    "Perdu": "bg-muted text-muted-foreground",
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

  // ─── Lock time remaining ──────────────────────────────────────────────────

  const getLockRemaining = (hc: DbHotCall): string | null => {
    if (!hc.lock_expires_at) return null;
    const diff = new Date(hc.lock_expires_at).getTime() - Date.now();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600000);
    const mins = Math.ceil((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h${mins}m` : `${mins}m`;
  };

  const getPhaseLabel = (phase: string) => {
    return HOT_CALL_PHASE_LABELS[phase as HotCallPhase] || phase;
  };

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleClaim = useCallback(
    async (id: string) => {
      if (!currentRepId) return;
      try {
        await claimMut.mutateAsync({ id, repId: currentRepId });
        // Also set phase to "claimed"
        await updateMut.mutateAsync({
          id,
          updates: { phase: HotCallPhase.CLAIMED },
          extendLock: false,
        });
        toast.success("Lead assigné");
      } catch (err: any) {
        if (err.message === "ALREADY_CLAIMED") {
          toast.error("Ce lead est déjà pris par un autre rep.");
        } else {
          toast.error("Erreur lors de la prise du lead.");
        }
      }
    },
    [claimMut, updateMut, currentRepId]
  );

  const handleReturnToPool = useCallback(
    async (id: string) => {
      try {
        await releaseMut.mutateAsync(id);
        await updateMut.mutateAsync({
          id,
          updates: { phase: HotCallPhase.POOL },
          extendLock: false,
        });
        toast.success("Lead remis dans la pool.");
      } catch {
        toast.error("Erreur lors du retour en pool.");
      }
    },
    [releaseMut, updateMut]
  );

  const handleMarkClosed = useCallback(
    async (id: string) => {
      try {
        await updateMut.mutateAsync({
          id,
          updates: { phase: HotCallPhase.CLOSED },
          extendLock: false,
        });
        toast.success("Lead marqué comme fermé.");
      } catch {
        toast.error("Erreur.");
      }
    },
    [updateMut]
  );

  const handleScheduleFollowUp = async () => {
    if (!scheduleId || !scheduleDate) return;
    try {
      const followUpDatetime = `${scheduleDate}`;
      await updateMut.mutateAsync({
        id: scheduleId,
        updates: {
          phase: HotCallPhase.SCHEDULED_FOLLOW_UP,
          follow_up_date: followUpDatetime,
        },
        extendLock: true,
      });
      toast.success("Relance planifiée");
    } catch {
      toast.error("Erreur.");
    }
    setScheduleId(null);
  };

  const doAction = useCallback(
    async (id: string, updates: Record<string, any>) => {
      try {
        await updateMut.mutateAsync({ id, updates, extendLock: true });
      } catch {
        toast.error("Erreur.");
      }
    },
    [updateMut]
  );

  const openGoogleMaps = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const openPostCallPopup = (hc: DbHotCall) => {
    setPostCallId(hc.id);
    setPostCallFeedback((hc.last_feedback as HotCallFeedback) || "No answer");
    setPostCallNote("");
    setPostCallDate(hc.follow_up_date || today);
  };

  const submitPostCall = async () => {
    if (!postCallId) return;
    const repId = currentRepId || "";

    try {
      await updateMut.mutateAsync({
        id: postCallId,
        updates: {
          last_feedback: postCallFeedback,
          status: postCallFeedback,
          attempts: (hotCalls.find((h) => h.id === postCallId)?.attempts || 0) + 1,
          last_contact_date: today,
          follow_up_date: postCallDate || undefined,
        },
        extendLock: true,
      });

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
    const expires = new Date(Date.now() + CLAIM_DURATION_MS).toISOString();
    try {
      await updateMut.mutateAsync({
        id: reassignId,
        updates: {
          assigned_to_user_id: reassignRepId,
          locked_at: now,
          lock_expires_at: expires,
          last_action_at: now,
          phase: HotCallPhase.CLAIMED,
        },
      });
      toast.success("Lead réassigné");
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
    if (!hc || (hc.tags || []).includes(tag)) return;
    await doAction(hcId, { tags: [...(hc.tags || []), tag] });
  };

  const removeTag = async (hcId: string, tag: string) => {
    const hc = hotCalls.find((h) => h.id === hcId);
    if (!hc) return;
    await doAction(hcId, { tags: (hc.tags || []).filter((t: string) => t !== tag) });
  };

  const canActOn = (hc: DbHotCall) => {
    if (canManage) return true;
    return hc.assigned_to_user_id === currentRepId;
  };

  const tabBtnClass = (t: ViewTab) =>
    `px-4 py-2 text-sm rounded-lg transition-colors ${
      tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    }`;

  const emptyMessages: Record<ViewTab, { title: string; desc: string }> = {
    pool: {
      title: "Aucun Hot Call dans le pool",
      desc: "Les leads à rappeler apparaîtront ici automatiquement.",
    },
    mine: {
      title: "Aucun Hot Call assigné",
      desc: "Prenez un lead depuis le pool pour commencer vos relances.",
    },
    today: {
      title: "Aucune relance aujourd'hui",
      desc: "Les leads avec une relance planifiée pour aujourd'hui apparaîtront ici.",
    },
    week: {
      title: "Aucune relance cette semaine",
      desc: "Les leads avec une relance dans les 7 prochains jours apparaîtront ici.",
    },
  };

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
            { label: "Pool disponible", sub: "Leads à prendre", value: stats.pool, icon: Users, color: "text-info" },
            { label: "Mes Hot Calls", sub: "En cours", value: stats.mine, icon: Lock, color: "text-primary" },
            { label: "Récupération", sub: "Taux de fermeture", value: `${stats.recoveryRate}%`, icon: TrendingUp, color: "text-warning" },
            { label: "Tentatives", sub: "Moyenne par lead", value: stats.avgAttempts, icon: RotateCcw, color: "text-muted-foreground" },
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

        {/* Tab toggle + search */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            <button onClick={() => setTab("pool")} className={tabBtnClass("pool")}>
              <span className="flex items-center gap-1.5"><Hand className="h-3.5 w-3.5" /> Pool ({poolCalls.length})</span>
            </button>
            <button onClick={() => setTab("mine")} className={tabBtnClass("mine")}>
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Mes Hot Calls ({myCalls.length})</span>
            </button>
            <button onClick={() => setTab("today")} className={tabBtnClass("today")}>
              <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Aujourd'hui ({atRiskToday.length + todayCalls.length})</span>
            </button>
            <button onClick={() => setTab("week")} className={tabBtnClass("week")}>
              <span className="flex items-center gap-1.5"><CalendarRange className="h-3.5 w-3.5" /> Cette semaine ({atRiskWeek.length + weekCalls.length})</span>
            </button>
            {canManage && (
              <span className="text-[10px] text-muted-foreground self-center ml-1">
                Total: {hotCalls.length}
              </span>
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
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty states — for pool/mine tabs */}
        {!isLoading && filtered.length === 0 && (tab === "pool" || tab === "mine") && (
          <div className="glass-card p-12 text-center">
            <Flame className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{emptyMessages[tab].title}</h3>
            <p className="text-sm text-muted-foreground">{emptyMessages[tab].desc}</p>
          </div>
        )}

        {/* À faire views (today/week): dual sections */}
        {!isLoading && (tab === "today" || tab === "week") && (
          <div className="space-y-6">
            {/* Section 1: RDV à risque */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h2 className="text-sm font-semibold text-foreground">
                  RDV à risque (à confirmer)
                </h2>
                <span className="text-xs text-muted-foreground">
                  ({(tab === "today" ? atRiskToday : atRiskWeek).length})
                </span>
              </div>
              <AtRiskAppointmentsSection
                appointments={tab === "today" ? atRiskToday : atRiskWeek}
                canManage={canManage}
              />
            </div>

            {/* Section 2: Hot Calls à relancer */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-destructive" />
                <h2 className="text-sm font-semibold text-foreground">
                  Hot Calls à relancer
                </h2>
                <span className="text-xs text-muted-foreground">
                  ({filtered.length})
                </span>
              </div>
              {filtered.length === 0 && (
                <div className="glass-card p-8 text-center">
                  <Flame className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {tab === "today"
                      ? "Aucun Hot Call à relancer aujourd'hui."
                      : "Aucun Hot Call à relancer cette semaine."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hot Calls Table */}
        {!isLoading && filtered.length > 0 && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Nom", "Téléphone", "Adresse", "Phase", "Feedback", "Tentatives", "Relance",
                      ...(tab !== "pool" ? ["Assigné à"] : []),
                      ...(tab === "mine" ? ["Lock"] : []),
                      "Tags", "Actions",
                    ].map((h) => (
                      <th key={h} className="text-left px-3 py-3 text-muted-foreground font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h) => {
                    const isMine = h.assigned_to_user_id === currentRepId;
                    const lockRemaining = getLockRemaining(h);
                    const editable = canActOn(h);

                    return (
                      <tr key={h.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${isMine ? "bg-primary/5" : ""}`}>
                        {/* Nom */}
                        <td className="px-3 py-3 font-medium whitespace-nowrap">
                          <button onClick={() => setSelectedHotCallForFiche(h)} className="text-primary hover:underline text-left">
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${phaseColors[h.phase] || "bg-muted text-muted-foreground"}`}>
                            {getPhaseLabel(h.phase)}
                          </span>
                        </td>

                        {/* Feedback */}
                        <td className="px-3 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${feedbackColors[h.last_feedback] || "bg-muted text-muted-foreground"}`}>
                            {h.last_feedback}
                          </span>
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
                            <span className="text-xs text-foreground">
                              {h.assigned_to_user_id ? h.assigned_to_user_id.substring(0, 8) + "…" : "—"}
                            </span>
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
                            {(h.tags || []).map((tag) => (
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
                                    {DEFAULT_TAGS.filter((t) => !(h.tags || []).includes(t)).map((t) => (
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

                            {/* Schedule follow-up */}
                            {editable && tab !== "pool" && (
                              <button
                                onClick={() => { setScheduleId(h.id); setScheduleDate(h.follow_up_date || ""); setScheduleTime("09:00"); }}
                                className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                title="Planifier relance"
                              >
                                <CalendarPlus className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Return to pool (Owner/Manager only) */}
                            {canReassign && tab !== "pool" && h.phase !== HotCallPhase.CLOSED && (
                              <button
                                onClick={() => handleReturnToPool(h.id)}
                                className="p-1.5 rounded hover:bg-warning/20 text-muted-foreground hover:text-warning transition-colors"
                                title="Remettre dans la pool"
                              >
                                <Unlock className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Mark dead/closed */}
                            {editable && h.phase !== HotCallPhase.CLOSED && (
                              <button
                                onClick={() => handleMarkClosed(h.id)}
                                className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                                title="Marquer Dead/Closed"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Edit follow-up date */}
                            {editable && (
                              <button
                                onClick={() => { setEditDateId(h.id); setEditDateValue(h.follow_up_date || ""); }}
                                className="p-1.5 rounded hover:bg-info/20 text-muted-foreground hover:text-info transition-colors"
                                title="Modifier date relance"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Reassign (manager) */}
                            {canReassign && (
                              <button
                                onClick={() => { setReassignId(h.id); setReassignRepId(h.assigned_to_user_id || ""); }}
                                className="p-1.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                title="Réassigner"
                              >
                                <Users className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Delete (manager) */}
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
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Fiche Client Modal */}
      {selectedHotCallForFiche && (
        <FicheClient
          appointment={{
            id: selectedHotCallForFiche.id,
            fullName: selectedHotCallForFiche.full_name,
            phone: selectedHotCallForFiche.phone,
            address: selectedHotCallForFiche.address,
            city: selectedHotCallForFiche.city,
            origin: selectedHotCallForFiche.origin || undefined,
            date: selectedHotCallForFiche.last_contact_date || "",
            time: "",
            repId: selectedHotCallForFiche.assigned_to_user_id || "",
            preQual1: "",
            preQual2: "",
            notes: selectedHotCallForFiche.notes || "",
            status: "Planifié",
            source: (selectedHotCallForFiche.source as "Door-to-door" | "Referral") || "Door-to-door",
            smsScheduled: false,
            createdAt: selectedHotCallForFiche.created_at,
            statusLog: [],
          }}
          hotCall={{
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
          }}
          open={!!selectedHotCallForFiche}
          onOpenChange={(o) => { if (!o) setSelectedHotCallForFiche(null); }}
        />
      )}

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

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Note</label>
              <textarea
                value={postCallNote}
                onChange={(e) => setPostCallNote(e.target.value)}
                placeholder="Note rapide..."
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Prochaine relance</label>
              <input
                type="date"
                value={postCallDate}
                onChange={(e) => setPostCallDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={submitPostCall} className="flex-1">
                Enregistrer + 1 tentative
              </Button>
              <Button variant="outline" onClick={() => setPostCallId(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Popup */}
      <Dialog open={!!scheduleId} onOpenChange={(o) => { if (!o) setScheduleId(null); }}>
        <DialogContent className="sm:max-w-[350px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Planifier relance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date de relance</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Heure</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleScheduleFollowUp} className="flex-1" disabled={!scheduleDate}>Planifier</Button>
              <Button variant="outline" onClick={() => setScheduleId(null)}>Annuler</Button>
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
              <label className="text-xs text-muted-foreground mb-1 block">ID du représentant</label>
              <input
                value={reassignRepId}
                onChange={(e) => setReassignRepId(e.target.value)}
                placeholder="Entrez l'ID du représentant..."
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={async () => {
                if (!reassignId) return;
                if (!reassignRepId) {
                  await handleReturnToPool(reassignId);
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
