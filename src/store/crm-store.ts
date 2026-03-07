import { create } from "zustand";
import {
  Appointment, AppointmentStatus, HotCall, HotCallStatus, HotCallPhase,
  HotCallFeedback, CallLogEntry, StatusChangeLog, HOT_CALL_TRIGGER_STATUSES
} from "@/data/crm-data";
import { AppointmentStatus as AS } from "@/domain/enums";

// Re-export AppRole from workspace system
export type { AppRole } from "@/lib/workspace/WorkspaceProvider";

// Re-export useAuth as backward-compatible shim
export { useAuthCompat as useAuth } from "@/lib/auth/useAuthCompat";

interface CrmState {
  appointments: Appointment[];
  hotCalls: HotCall[];
  dailyTarget: number;
  weeklyTarget: number;
  repGoals: Record<string, number>;
  addAppointment: (appt: Omit<Appointment, "id" | "createdAt" | "statusLog">) => void;
  updateStatus: (id: string, status: AppointmentStatus, userId?: string) => void;
  closeAppointment: (id: string, closedValue: number, userId?: string) => void;
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

const computeFollowUpDate = (status: HotCallStatus, fromDate: string): string => {
  const d = new Date(fromDate);
  if (status === "Follow-up 3 months") { d.setMonth(d.getMonth() + 3); return d.toISOString().split("T")[0]; }
  if (status === "Follow-up 6 months") { d.setMonth(d.getMonth() + 6); return d.toISOString().split("T")[0]; }
  if (status === "Follow-up 9 months") { d.setMonth(d.getMonth() + 9); return d.toISOString().split("T")[0]; }
  if (status === "Follow-up 12 months") { d.setMonth(d.getMonth() + 12); return d.toISOString().split("T")[0]; }
  return fromDate;
};

export const useCrm = create<CrmState>((set, get) => ({
  appointments: [],
  hotCalls: [],
  repGoals: {},
  dailyTarget: 15,
  weeklyTarget: 75,

  addAppointment: (appt) =>
    set((state) => ({
      appointments: [
        ...state.appointments,
        {
          ...appt,
          id: `a${Date.now()}`,
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

  closeAppointment: (id, closedValue, userId = "system") =>
    set((state) => ({
      appointments: state.appointments.map((a) => {
        if (a.id !== id) return a;
        const log = createLogEntry(a.status, AS.CLOSED, userId);
        return {
          ...a,
          status: AS.CLOSED,
          closedValue,
          closedAt: new Date().toISOString(),
          statusLog: [...a.statusLog, log],
        };
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
                status: AS.PLANNED,
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
                status: AS.PLANNED,
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
            status: AS.PLANNED,
            createdAt: new Date().toISOString().split("T")[0],
            statusLog: [],
          },
        ],
      };
    }),

  moveAppointmentToHotCalls: (appointmentId, status = "Premier contact") =>
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
            city: appt.city || "",
            source: "Door-to-door",
            repId: appt.repId,
            status,
            phase: "pool" as HotCallPhase,
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
      if (appt.status === AS.BACKLOG) return;
      const alreadyInHotCalls = state.hotCalls.some((h) => h.originalAppointmentId === appt.id);
      if (alreadyInHotCalls) return;
      if (HOT_CALL_TRIGGER_STATUSES.includes(appt.status)) {
        state.moveAppointmentToHotCalls(appt.id, "Premier contact");
      }
    });
  },

  convertBacklogToAppointment: (id, updates) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, ...updates, status: AS.PLANNED } : a
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
            a.id === appt.id ? { ...a, date, time: time || "09:00", status: AS.PLANNED } : a
          ),
        };
      }
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
            status: AS.PLANNED,
            createdAt: new Date().toISOString().split("T")[0],
            statusLog: [],
          },
        ],
      };
    }),
}));
