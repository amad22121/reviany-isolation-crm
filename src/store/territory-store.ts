import { create } from "zustand";
import { USE_MOCK } from "@/lib/data/config";
import { MOCK_TERRITORIES, MOCK_MAP_ZONES } from "@/lib/data/mock-data";

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

export interface MapZone {
  id: string;
  name: string;
  city: string;
  status: TerritoryStatus;
  repId: string;
  plannedDate: string;
  notes: string;
  polygon: [number, number][];
  statusLog: TerritoryLog[];
}

interface TerritoryState {
  territories: Territory[];
  mapZones: MapZone[];
  addTerritory: (t: Omit<Territory, "id" | "createdAt" | "statusLog">) => void;
  updateTerritoryStatus: (id: string, status: TerritoryStatus, userId: string) => void;
  updateTerritory: (id: string, updates: Partial<Territory>, userId?: string) => void;
  deleteTerritory: (id: string) => void;
  updateMapZoneStatus: (id: string, status: TerritoryStatus, userId: string) => void;
  updateMapZone: (id: string, updates: Partial<MapZone>) => void;
}


const INITIAL_TERRITORIES: Territory[] = USE_MOCK ? MOCK_TERRITORIES : [];

const INITIAL_MAP_ZONES: MapZone[] = USE_MOCK ? MOCK_MAP_ZONES : [];

const createTerritoryLog = (prev: string, next: string, userId: string): TerritoryLog => {
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

export const useTerritories = create<TerritoryState>((set) => ({
  territories: INITIAL_TERRITORIES,
  mapZones: INITIAL_MAP_ZONES,

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

  updateMapZoneStatus: (id, status, userId) =>
    set((state) => ({
      mapZones: state.mapZones.map((z) => {
        if (z.id !== id) return z;
        const log = createTerritoryLog(z.status, status, userId);
        return { ...z, status, statusLog: [...z.statusLog, log] };
      }),
    })),

  updateMapZone: (id, updates) =>
    set((state) => ({
      mapZones: state.mapZones.map((z) => (z.id === id ? { ...z, ...updates } : z)),
    })),
}));
