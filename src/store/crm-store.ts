import { create } from "zustand";
import { Appointment, INITIAL_APPOINTMENTS, SALES_REPS } from "@/data/crm-data";

interface AuthState {
  isLoggedIn: boolean;
  role: "manager" | "sales_rep" | null;
  currentRepId: string | null;
  login: () => void;
  setRole: (role: "manager" | "sales_rep", repId?: string) => void;
  logout: () => void;
}

interface CrmState {
  appointments: Appointment[];
  addAppointment: (appt: Omit<Appointment, "id" | "status" | "smsScheduled" | "createdAt">) => void;
  updateStatus: (id: string, status: Appointment["status"]) => void;
}

export const useAuth = create<AuthState>((set) => ({
  isLoggedIn: false,
  role: null,
  currentRepId: null,
  login: () => set({ isLoggedIn: true }),
  setRole: (role, repId) => set({ role, currentRepId: repId || SALES_REPS[0].id }),
  logout: () => set({ isLoggedIn: false, role: null, currentRepId: null }),
}));

export const useCrm = create<CrmState>((set) => ({
  appointments: INITIAL_APPOINTMENTS,
  addAppointment: (appt) =>
    set((state) => ({
      appointments: [
        ...state.appointments,
        {
          ...appt,
          id: `a${Date.now()}`,
          status: "Pending",
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
}));
