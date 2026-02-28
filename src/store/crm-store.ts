import { create } from "zustand";
import { Appointment, AppointmentStatus, INITIAL_APPOINTMENTS, SALES_REPS, HotCall, HotCallStatus, HotCallPhase, HotCallFeedback, CallLogEntry, StatusChangeLog } from "@/data/crm-data";

// Re-export AppRole from new workspace system
export type { AppRole } from "@/lib/workspace/WorkspaceProvider";

// Re-export useAuth as backward-compatible shim
export { useAuthCompat as useAuth } from "@/lib/auth/useAuthCompat";

// Legacy AuthState interface removed — now provided by useAuthCompat

interface CrmState {
  appointments: Appointment[];
  hotCalls: HotCall[];
  dailyTarget: number;
  weeklyTarget: number;
  repGoals: Record<string, number>;
  addAppointment: (appt: Omit<Appointment, "id" | "smsScheduled" | "createdAt" | "statusLog">) => void;
  updateStatus: (id: string, status: AppointmentStatus, userId?: string) => void;
  deleteAppointment: (id: string) => void;
  updateNotes: (id: string, notes: string) => void;
  setDailyTarget: (target: number) => void;
  setWeeklyTarget: (target: number) => void;
  setRepGoal: (repId: string, goal: number) => void;
  addHotCall: (hc: Omit<HotCall, "id" | "attempts" | "createdAt" | "tags" | "callHistory">) => void;
  updateHotCallStatus: (id: string, status: HotCallStatus) => void;
  updateHotCallPhase: (id: string, phase: HotCallPhase) => void;
  updateHotCallFeedback: (id: string, feedback: HotCallFeedback) => void;
  updateHotCallNotes: (id: string, notes: string) => void;
  deleteHotCall: (id: string) => void;
  moveAppointmentToHotCalls: (appointmentId: string, status?: HotCallStatus) => void;
  convertBacklogToAppointment: (id: string, updates: Partial<Appointment>) => void;
  incrementHotCallAttempts: (id: string) => void;
  updateHotCallFollowUpDate: (id: string, date: string) => void;
  updateHotCallTags: (id: string, tags: string[]) => void;
  addHotCallLog: (id: string, entry: CallLogEntry) => void;
  logCallAndUpdate: (id: string, status: HotCallStatus, note: string, followUpDate: string, repId: string) => void;
  reassignHotCall: (id: string, repId: string) => void;
  rebookHotCall: (id: string, date: string, time: string) => void;
  decrementHotCallAttempts: (id: string) => void;
  rescheduleHotCall: (id: string, date: string, time: string) => void;
  autoTriggerHotCalls: () => void;
}

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

const INITIAL_HOT_CALLS: HotCall[] = [
  { id: "hc1", fullName: "Diane Simard", phone: "(438) 555-0112", address: "430 Rue Beaubien E", city: "Montréal", source: "Door-to-door", repId: "rep2", status: "No answer", phase: "À rappeler", lastFeedback: "No answer", attempts: 2, lastContactDate: yesterday, followUpDate: today, notes: "Non confirmé, replanifier", createdAt: yesterday, tags: ["Callback"], callHistory: [{ date: yesterday, time: "10:30", repId: "rep2", note: "Pas de réponse" }] },
  { id: "hc2", fullName: "Lucie Tremblay", phone: "(514) 555-0120", address: "890 Rue Wellington", city: "Verdun", source: "Referral", repId: "rep1", status: "Call back later", phase: "En cours", lastFeedback: "Call back later", attempts: 1, lastContactDate: yesterday, followUpDate: today, notes: "Rappeler le matin", createdAt: yesterday, tags: ["À rappeler matin"], callHistory: [{ date: yesterday, time: "14:00", repId: "rep1", note: "Rappeler le matin" }] },
  { id: "hc3", fullName: "Yves Bouchard", phone: "(438) 555-0130", address: "1200 Avenue du Parc", city: "Montréal", source: "Door-to-door", repId: "rep3", status: "Follow-up 3 months", phase: "En cours", lastFeedback: "Follow-up 3 months", attempts: 3, lastContactDate: yesterday, followUpDate: "2026-05-19", notes: "Intéressé mais pas maintenant", createdAt: yesterday, tags: ["Client chaud"], callHistory: [{ date: yesterday, time: "11:00", repId: "rep3", note: "Intéressé mais pas maintenant" }] },
  { id: "hc4", fullName: "Julie Roy", phone: "(514) 555-0140", address: "567 Boulevard Gouin O", city: "Laval", source: "Door-to-door", repId: "rep4", status: "Reschedule requested", phase: "À rappeler", lastFeedback: "Reschedule requested", attempts: 1, lastContactDate: today, followUpDate: today, notes: "Veut un RDV en soirée", createdAt: today, tags: ["À rappeler soir"], callHistory: [{ date: today, time: "09:00", repId: "rep4", note: "Veut un RDV en soirée" }] },
];

const computeFollowUpDate = (status: HotCallStatus, fromDate: string): string => {
  const d = new Date(fromDate);
  if (status === "Follow-up 3 months") { d.setMonth(d.getMonth() + 3); return d.toISOString().split("T")[0]; }
  if (status === "Follow-up 6 months") { d.setMonth(d.getMonth() + 6); return d.toISOString().split("T")[0]; }
  if (status === "Follow-up 9 months") { d.setMonth(d.getMonth() + 9); return d.toISOString().split("T")[0]; }
  if (status === "Follow-up 12 months") { d.setMonth(d.getMonth() + 12); return d.toISOString().split("T")[0]; }
  return fromDate;
};

const createLogEntry = (prev: string, next: string, userId: string): StatusChangeLog => {
  const now = new Date();
  return {
    date: now.toISOString().split("T")[0],
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    field: "status",
    previousValue: prev,
    newValue: next,
    userId,
  };
};

export const useCrm = create<CrmState>((set, get) => ({
  appointments: INITIAL_APPOINTMENTS,
  hotCalls: INITIAL_HOT_CALLS,
  repGoals: Object.fromEntries(SALES_REPS.map((r) => [r.id, 0])),
  dailyTarget: 15,
  weeklyTarget: 75,
  addAppointment: (appt) =>
    set((state) => ({
      appointments: [
        ...state.appointments,
        {
          ...appt,
          id: `a${Date.now()}`,
          smsScheduled: false,
          createdAt: new Date().toISOString().split("T")[0],
          statusLog: [],
        },
      ],
    })),
  updateStatus: (id, status, userId = "system") =>
    set((state) => ({
      appointments: state.appointments.map((a) => {
        if (a.id !== id) return a;
        const log = createLogEntry(a.status, status, userId);
        return { ...a, status, statusLog: [...a.statusLog, log] };
      }),
    })),
  deleteAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== id),
    })),
  updateNotes: (id, notes) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, notes } : a
      ),
    })),
  setDailyTarget: (target) => set({ dailyTarget: target }),
  setWeeklyTarget: (target) => set({ weeklyTarget: target }),
  setRepGoal: (repId, goal) =>
    set((state) => ({
      repGoals: { ...state.repGoals, [repId]: goal },
    })),
  addHotCall: (hc) =>
    set((state) => ({
      hotCalls: [
        ...state.hotCalls,
        { ...hc, id: `hc${Date.now()}`, attempts: 0, createdAt: new Date().toISOString().split("T")[0], tags: [], callHistory: [] },
      ],
    })),
  updateHotCallStatus: (id, status) =>
    set((state) => {
      const todayStr = new Date().toISOString().split("T")[0];
      if (status === "Booked") {
        const hc = state.hotCalls.find((h) => h.id === id);
        if (hc) {
          return {
            hotCalls: state.hotCalls.filter((h) => h.id !== id),
            appointments: [
              ...state.appointments,
              {
                id: `a${Date.now()}`,
                fullName: hc.fullName,
                phone: hc.phone,
                address: hc.address,
                city: hc.city,
                origin: hc.origin,
                date: todayStr,
                time: "09:00",
                repId: hc.repId,
                preQual1: "",
                preQual2: "",
                notes: hc.notes,
                status: "En attente" as const,
                source: hc.source,
                smsScheduled: false,
                createdAt: todayStr,
                statusLog: [],
              },
            ],
          };
        }
      }
      const autoFollowUp = status.startsWith("Follow-up") ? computeFollowUpDate(status, todayStr) : undefined;
      return {
        hotCalls: state.hotCalls.map((h) =>
          h.id === id ? {
            ...h,
            status,
            attempts: h.attempts + 1,
            lastContactDate: todayStr,
            ...(autoFollowUp ? { followUpDate: autoFollowUp } : {}),
          } : h
        ),
      };
    }),
  updateHotCallPhase: (id, phase) =>
    set((state) => ({
      hotCalls: state.hotCalls.map((h) =>
        h.id === id ? { ...h, phase } : h
      ),
    })),
  updateHotCallFeedback: (id, feedback) =>
    set((state) => {
      const todayStr = new Date().toISOString().split("T")[0];
      const autoFollowUp = feedback.startsWith("Follow-up") ? computeFollowUpDate(feedback as HotCallStatus, todayStr) : undefined;
      return {
        hotCalls: state.hotCalls.map((h) =>
          h.id === id ? {
            ...h,
            lastFeedback: feedback,
            status: feedback as HotCallStatus,
            lastContactDate: todayStr,
            ...(autoFollowUp ? { followUpDate: autoFollowUp } : {}),
          } : h
        ),
      };
    }),
  updateHotCallNotes: (id, notes) =>
    set((state) => ({
      hotCalls: state.hotCalls.map((h) =>
        h.id === id ? { ...h, notes } : h
      ),
    })),
  deleteHotCall: (id) =>
    set((state) => ({
      hotCalls: state.hotCalls.filter((h) => h.id !== id),
    })),
  incrementHotCallAttempts: (id) =>
    set((state) => ({
      hotCalls: state.hotCalls.map((h) =>
        h.id === id ? { ...h, attempts: h.attempts + 1 } : h
      ),
    })),
  updateHotCallFollowUpDate: (id, date) =>
    set((state) => ({
      hotCalls: state.hotCalls.map((h) =>
        h.id === id ? { ...h, followUpDate: date } : h
      ),
    })),
  updateHotCallTags: (id, tags) =>
    set((state) => ({
      hotCalls: state.hotCalls.map((h) =>
        h.id === id ? { ...h, tags } : h
      ),
    })),
  addHotCallLog: (id, entry) =>
    set((state) => ({
      hotCalls: state.hotCalls.map((h) =>
        h.id === id ? { ...h, callHistory: [...h.callHistory, entry] } : h
      ),
    })),
  logCallAndUpdate: (id, status, note, followUpDate, repId) =>
    set((state) => {
      const todayStr = new Date().toISOString().split("T")[0];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      if (status === "Booked") {
        const hc = state.hotCalls.find((h) => h.id === id);
        if (hc) {
          return {
            hotCalls: state.hotCalls.filter((h) => h.id !== id),
            appointments: [
              ...state.appointments,
              {
                id: `a${Date.now()}`,
                fullName: hc.fullName,
                phone: hc.phone,
                address: hc.address,
                city: hc.city,
                origin: hc.origin,
                date: todayStr,
                time: "09:00",
                repId: hc.repId,
                preQual1: "",
                preQual2: "",
                notes: note || hc.notes,
                status: "En attente" as const,
                source: hc.source,
                smsScheduled: false,
                createdAt: todayStr,
                statusLog: [],
              },
            ],
          };
        }
      }

      const autoFollowUp = status.startsWith("Follow-up") ? computeFollowUpDate(status, todayStr) : followUpDate;
      return {
        hotCalls: state.hotCalls.map((h) =>
          h.id === id ? {
            ...h,
            status,
            lastFeedback: (["No answer", "Call back later", "Reschedule requested", "Not interested", "Follow-up 3 months", "Follow-up 6 months", "Follow-up 9 months", "Follow-up 12 months"].includes(status) ? status : h.lastFeedback) as HotCallFeedback,
            attempts: h.attempts + 1,
            lastContactDate: todayStr,
            followUpDate: autoFollowUp || h.followUpDate,
            notes: note || h.notes,
            callHistory: [...h.callHistory, { date: todayStr, time: timeStr, repId, note: note || "Appel effectué" }],
          } : h
        ),
      };
    }),
  reassignHotCall: (id, repId) =>
    set((state) => ({
      hotCalls: state.hotCalls.map((h) =>
        h.id === id ? { ...h, repId } : h
      ),
    })),
  rebookHotCall: (id, date, time) =>
    set((state) => {
      const hc = state.hotCalls.find((h) => h.id === id);
      if (!hc) return state;
      return {
        hotCalls: state.hotCalls.filter((h) => h.id !== id),
        appointments: [
          ...state.appointments,
          {
            id: `a${Date.now()}`,
            fullName: hc.fullName,
            phone: hc.phone,
            address: hc.address,
            city: hc.city,
            origin: hc.origin,
            date,
            time: time || "09:00",
            repId: hc.repId,
            preQual1: "",
            preQual2: "",
            notes: hc.notes,
            status: "En attente" as const,
            source: hc.source,
            smsScheduled: false,
            createdAt: new Date().toISOString().split("T")[0],
            statusLog: [],
          },
        ],
      };
    }),
  moveAppointmentToHotCalls: (appointmentId, status = "No answer") =>
    set((state) => {
      const appt = state.appointments.find((a) => a.id === appointmentId);
      if (!appt) return state;
      const todayStr = new Date().toISOString().split("T")[0];
      const existing = state.hotCalls.find((h) => h.originalAppointmentId === appointmentId);
      if (existing) return state;
      return {
        hotCalls: [
          ...state.hotCalls,
          {
            id: `hc${Date.now()}`,
            fullName: appt.fullName,
            phone: appt.phone,
            address: appt.address,
            city: appt.city || "Montréal",
            source: appt.source || "Door-to-door",
            repId: appt.repId,
            status,
            phase: "À rappeler" as HotCallPhase,
            lastFeedback: "No answer" as HotCallFeedback,
            attempts: 1,
            lastContactDate: todayStr,
            followUpDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            notes: appt.notes,
            createdAt: todayStr,
            originalAppointmentId: appt.id,
            origin: appt.origin,
            tags: [],
            callHistory: [],
          },
        ],
      };
    }),
  autoTriggerHotCalls: () => {
    const state = get();

    state.appointments.forEach((appt) => {
      if (appt.status === "Backlog") return;
      const alreadyInHotCalls = state.hotCalls.some((h) => h.originalAppointmentId === appt.id);
      if (alreadyInHotCalls) return;

      // Annulé → automatically move to Hot Calls
      if (appt.status === "Annulé") {
        state.moveAppointmentToHotCalls(appt.id, "Premier contact");
      }
    });
  },
  convertBacklogToAppointment: (id, updates) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, ...updates, status: "En attente" as const } : a
      ),
    })),
  decrementHotCallAttempts: (id) =>
    set((state) => ({
      hotCalls: state.hotCalls.map((h) =>
        h.id === id ? { ...h, attempts: Math.max(0, h.attempts - 1) } : h
      ),
    })),
  rescheduleHotCall: (id, date, time) =>
    set((state) => {
      const hc = state.hotCalls.find((h) => h.id === id);
      if (!hc) return state;
      const appt = hc.originalAppointmentId
        ? state.appointments.find((a) => a.id === hc.originalAppointmentId)
        : null;
      if (appt) {
        return {
          hotCalls: state.hotCalls.filter((h) => h.id !== id),
          appointments: state.appointments.map((a) =>
            a.id === appt.id ? { ...a, date, time: time || "09:00", status: "En attente" as const } : a
          ),
        };
      }
      // No original appointment found - create one as fallback
      return {
        hotCalls: state.hotCalls.filter((h) => h.id !== id),
        appointments: [
          ...state.appointments,
          {
            id: `a${Date.now()}`,
            fullName: hc.fullName,
            phone: hc.phone,
            address: hc.address,
            city: hc.city,
            origin: hc.origin,
            date,
            time: time || "09:00",
            repId: hc.repId,
            preQual1: "",
            preQual2: "",
            notes: hc.notes,
            status: "En attente" as const,
            source: hc.source,
            smsScheduled: false,
            createdAt: new Date().toISOString().split("T")[0],
            statusLog: [],
          },
        ],
      };
    }),
}));

// Old useAuth zustand store removed — now re-exported from useAuthCompat above
