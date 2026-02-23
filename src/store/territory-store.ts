import { create } from "zustand";
import { SALES_REPS } from "@/data/crm-data";

export type TerritoryStatus = "À faire" | "Planifié aujourd'hui" | "En cours" | "Fait";

export const TERRITORY_STATUSES: TerritoryStatus[] = ["À faire", "Planifié aujourd'hui", "En cours", "Fait"];

export interface TerritoryLog {
  date: string;
  time: string;
  field: string;
  previousValue: string;
  newValue: string;
  userId: string;
}

export interface Territory {
  id: string;
  city: string;
  sector: string;
  street: string;
  status: TerritoryStatus;
  repId: string;
  lastVisitDate: string;
  estimatedDoors: number | null;
  notes: string;
  createdAt: string;
  statusLog: TerritoryLog[];
}

interface TerritoryState {
  territories: Territory[];
  addTerritory: (t: Omit<Territory, "id" | "createdAt" | "statusLog">) => void;
  updateTerritoryStatus: (id: string, status: TerritoryStatus, userId: string) => void;
  updateTerritory: (id: string, updates: Partial<Territory>, userId?: string) => void;
  deleteTerritory: (id: string) => void;
}

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

const INITIAL_TERRITORIES: Territory[] = [
  { id: "t1", city: "Montréal", sector: "Plateau Mont-Royal", street: "Rue Saint-Denis (entre Sherbrooke et Mont-Royal)", status: "Fait", repId: "rep1", lastVisitDate: yesterday, estimatedDoors: 45, notes: "Bon secteur, plusieurs propriétaires intéressés", createdAt: yesterday, statusLog: [] },
  { id: "t2", city: "Montréal", sector: "Rosemont", street: "Avenue Papineau (nord de Beaubien)", status: "Planifié aujourd'hui", repId: "rep2", lastVisitDate: "", estimatedDoors: 30, notes: "", createdAt: today, statusLog: [] },
  { id: "t3", city: "Montréal", sector: "Villeray", street: "Rue Jarry (entre Saint-Laurent et Saint-Denis)", status: "À faire", repId: "rep1", lastVisitDate: "", estimatedDoors: 55, notes: "Zone dense, beaucoup de duplex", createdAt: today, statusLog: [] },
  { id: "t4", city: "Laval", sector: "Chomedey", street: "Boulevard Curé-Labelle (section sud)", status: "En cours", repId: "rep3", lastVisitDate: today, estimatedDoors: 25, notes: "En cours de prospection", createdAt: today, statusLog: [] },
  { id: "t5", city: "Montréal", sector: "Verdun", street: "Rue Wellington (entre LaSalle et de l'Église)", status: "Fait", repId: "rep4", lastVisitDate: yesterday, estimatedDoors: 35, notes: "Complété, quelques leads récupérés", createdAt: yesterday, statusLog: [] },
  { id: "t6", city: "Longueuil", sector: "Vieux-Longueuil", street: "Rue Saint-Charles (centre-ville)", status: "À faire", repId: "rep5", lastVisitDate: "", estimatedDoors: 40, notes: "", createdAt: today, statusLog: [] },
];

export const useTerritories = create<TerritoryState>((set) => ({
  territories: INITIAL_TERRITORIES,

  addTerritory: (t) =>
    set((state) => ({
      territories: [
        ...state.territories,
        { ...t, id: `t${Date.now()}`, createdAt: new Date().toISOString().split("T")[0], statusLog: [] },
      ],
    })),

  updateTerritoryStatus: (id, status, userId) =>
    set((state) => {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      return {
        territories: state.territories.map((t) => {
          if (t.id !== id) return t;
          const log: TerritoryLog = { date: dateStr, time: timeStr, field: "status", previousValue: t.status, newValue: status, userId };
          return {
            ...t,
            status,
            lastVisitDate: status === "Fait" ? dateStr : t.lastVisitDate,
            statusLog: [...t.statusLog, log],
          };
        }),
      };
    }),

  updateTerritory: (id, updates, userId = "system") =>
    set((state) => ({
      territories: state.territories.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTerritory: (id) =>
    set((state) => ({ territories: state.territories.filter((t) => t.id !== id) })),
}));
