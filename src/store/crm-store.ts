import { create } from "zustand";
import { Appointment, INITIAL_APPOINTMENTS, SALES_REPS, ZONES, Zone } from "@/data/crm-data";

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
  zones: Zone[];
  dailyTarget: number;
  addAppointment: (appt: Omit<Appointment, "id" | "status" | "smsScheduled" | "createdAt">) => void;
  updateStatus: (id: string, status: Appointment["status"]) => void;
  setDailyTarget: (target: number) => void;
  assignZone: (zoneId: string, repId: string) => void;
}

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

export const useCrm = create<CrmState>((set) => ({
  appointments: INITIAL_APPOINTMENTS,
  zones: ZONES,
  dailyTarget: 15,
  addAppointment: (appt) =>
    set((state) => ({
      appointments: [
        ...state.appointments,
        {
          ...appt,
          id: `a${Date.now()}`,
          status: "En attente",
          smsScheduled: true,
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
  setDailyTarget: (target) => set({ dailyTarget: target }),
  assignZone: (zoneId, repId) =>
    set((state) => ({
      zones: state.zones.map((z) =>
        z.id === zoneId ? { ...z, assignedRepId: repId } : z
      ),
    })),
}));
