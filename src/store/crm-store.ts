import { create } from "zustand";
import { Appointment, INITIAL_APPOINTMENTS, SALES_REPS, HotCall, HotCallStatus } from "@/data/crm-data";

export type AppRole = "proprietaire" | "gestionnaire" | "representant";

interface AuthState {
  isLoggedIn: boolean;
  role: AppRole | null;
  currentRepId: string | null;
  currentManagerId: string | null;
  login: () => void;
  setRole: (role: AppRole, repId?: string, managerId?: string) => void;
  logout: () => void;
}

interface CrmState {
  appointments: Appointment[];
  hotCalls: HotCall[];
  dailyTarget: number;
  repGoals: Record<string, number>;
  addAppointment: (appt: Omit<Appointment, "id" | "smsScheduled" | "createdAt">) => void;
  updateStatus: (id: string, status: Appointment["status"]) => void;
  deleteAppointment: (id: string) => void;
  updateNotes: (id: string, notes: string) => void;
  setDailyTarget: (target: number) => void;
  setRepGoal: (repId: string, goal: number) => void;
  addHotCall: (hc: Omit<HotCall, "id" | "attempts" | "createdAt">) => void;
  updateHotCallStatus: (id: string, status: HotCallStatus) => void;
  updateHotCallNotes: (id: string, notes: string) => void;
  deleteHotCall: (id: string) => void;
  moveAppointmentToHotCalls: (appointmentId: string, status?: HotCallStatus) => void;
  convertBacklogToAppointment: (id: string, updates: Partial<Appointment>) => void;
}

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

const INITIAL_HOT_CALLS: HotCall[] = [
  { id: "hc1", fullName: "Diane Simard", phone: "(438) 555-0112", address: "430 Rue Beaubien E", city: "Montréal", source: "Door-to-door", repId: "rep2", status: "No answer", attempts: 2, lastContactDate: yesterday, followUpDate: today, notes: "Absence, replanifier", createdAt: yesterday },
  { id: "hc2", fullName: "Lucie Tremblay", phone: "(514) 555-0120", address: "890 Rue Wellington", city: "Verdun", source: "Referral", repId: "rep1", status: "Call back later", attempts: 1, lastContactDate: yesterday, followUpDate: today, notes: "Rappeler le matin", createdAt: yesterday },
  { id: "hc3", fullName: "Yves Bouchard", phone: "(438) 555-0130", address: "1200 Avenue du Parc", city: "Montréal", source: "Door-to-door", repId: "rep3", status: "Follow-up 3 months", attempts: 3, lastContactDate: yesterday, followUpDate: "2026-05-19", notes: "Intéressé mais pas maintenant", createdAt: yesterday },
  { id: "hc4", fullName: "Julie Roy", phone: "(514) 555-0140", address: "567 Boulevard Gouin O", city: "Laval", source: "Door-to-door", repId: "rep4", status: "Reschedule requested", attempts: 1, lastContactDate: today, followUpDate: today, notes: "Veut un RDV en soirée", createdAt: today },
];

export const useCrm = create<CrmState>((set, get) => ({
  appointments: INITIAL_APPOINTMENTS,
  hotCalls: INITIAL_HOT_CALLS,
  repGoals: Object.fromEntries(SALES_REPS.map((r) => [r.id, 0])),
  dailyTarget: 15,
  addAppointment: (appt) =>
    set((state) => ({
      appointments: [
        ...state.appointments,
        {
          ...appt,
          id: `a${Date.now()}`,
          smsScheduled: false,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ],
    })),
  updateStatus: (id, status) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
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
  setRepGoal: (repId, goal) =>
    set((state) => ({
      repGoals: { ...state.repGoals, [repId]: goal },
    })),
  addHotCall: (hc) =>
    set((state) => ({
      hotCalls: [
        ...state.hotCalls,
        { ...hc, id: `hc${Date.now()}`, attempts: 0, createdAt: new Date().toISOString().split("T")[0] },
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
              },
            ],
          };
        }
      }
      return {
        hotCalls: state.hotCalls.map((h) =>
          h.id === id ? { ...h, status, attempts: h.attempts + 1, lastContactDate: todayStr } : h
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
  moveAppointmentToHotCalls: (appointmentId, status = "No answer") =>
    set((state) => {
      const appt = state.appointments.find((a) => a.id === appointmentId);
      if (!appt) return state;
      const todayStr = new Date().toISOString().split("T")[0];
      return {
        appointments: state.appointments.filter((a) => a.id !== appointmentId),
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
            attempts: 1,
            lastContactDate: todayStr,
            followUpDate: todayStr,
            notes: appt.notes,
            createdAt: todayStr,
            originalAppointmentId: appt.id,
          },
        ],
      };
    }),
  convertBacklogToAppointment: (id, updates) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, ...updates, status: "En attente" as const } : a
      ),
    })),
}));

export const useAuth = create<AuthState>((set) => ({
  isLoggedIn: false,
  role: null,
  currentRepId: null,
  currentManagerId: null,
  login: () => set({ isLoggedIn: true }),
  setRole: (role, repId, managerId) =>
    set({
      role,
      currentRepId: repId || (role === "representant" ? SALES_REPS[0].id : null),
      currentManagerId: managerId || null,
    }),
  logout: () => set({ isLoggedIn: false, role: null, currentRepId: null, currentManagerId: null }),
}));
