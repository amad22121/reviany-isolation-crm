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

const INITIAL_MAP_ZONES: MapZone[] = [
  {
    id: "mz1", name: "Plateau Mont-Royal", city: "Montréal", status: "Fait", repId: "rep1", plannedDate: yesterday, notes: "Secteur complété",
    polygon: [[45.5225, -73.5800], [45.5225, -73.5650], [45.5320, -73.5650], [45.5320, -73.5800]],
    statusLog: [],
  },
  {
    id: "mz2", name: "Rosemont–La Petite-Patrie", city: "Montréal", status: "Planifié aujourd'hui", repId: "rep2", plannedDate: today, notes: "Zone prioritaire aujourd'hui",
    polygon: [[45.5340, -73.5900], [45.5340, -73.5650], [45.5450, -73.5650], [45.5450, -73.5900]],
    statusLog: [],
  },
  {
    id: "mz3", name: "Villeray–Saint-Michel", city: "Montréal", status: "À faire", repId: "rep1", plannedDate: "", notes: "Zone dense, beaucoup de duplex",
    polygon: [[45.5450, -73.6150], [45.5450, -73.5900], [45.5560, -73.5900], [45.5560, -73.6150]],
    statusLog: [],
  },
  {
    id: "mz4", name: "Mercier–Hochelaga", city: "Montréal", status: "En cours", repId: "rep3", plannedDate: today, notes: "Prospection en cours",
    polygon: [[45.5400, -73.5600], [45.5400, -73.5350], [45.5520, -73.5350], [45.5520, -73.5600]],
    statusLog: [],
  },
  {
    id: "mz5", name: "Verdun", city: "Montréal", status: "Fait", repId: "rep4", plannedDate: yesterday, notes: "Complété, quelques leads récupérés",
    polygon: [[45.4520, -73.5750], [45.4520, -73.5550], [45.4620, -73.5550], [45.4620, -73.5750]],
    statusLog: [],
  },
  {
    id: "mz6", name: "Côte-des-Neiges", city: "Montréal", status: "À faire", repId: "rep5", plannedDate: "", notes: "",
    polygon: [[45.4900, -73.6350], [45.4900, -73.6100], [45.5050, -73.6100], [45.5050, -73.6350]],
    statusLog: [],
  },
  {
    id: "mz7", name: "Ahuntsic-Cartierville", city: "Montréal", status: "À faire", repId: "rep2", plannedDate: "", notes: "Grande zone résidentielle",
    polygon: [[45.5500, -73.6700], [45.5500, -73.6400], [45.5650, -73.6400], [45.5650, -73.6700]],
    statusLog: [],
  },
  {
    id: "mz8", name: "Saint-Léonard", city: "Montréal", status: "Planifié aujourd'hui", repId: "rep3", plannedDate: today, notes: "Planifié pour cet après-midi",
    polygon: [[45.5700, -73.5950], [45.5700, -73.5700], [45.5830, -73.5700], [45.5830, -73.5950]],
    statusLog: [],
  },
];

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
