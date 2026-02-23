import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TerritoryStatus } from "@/store/territory-store";

export interface DbMapZone {
  id: string;
  name: string;
  city: string;
  status: TerritoryStatus;
  rep_id: string;
  planned_date: string | null;
  notes: string | null;
  polygon: [number, number][];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStatusLog {
  id: string;
  zone_id: string;
  previous_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
}

const ZONES_KEY = ["map_zones"];
const LOGS_KEY = (zoneId: string) => ["map_zone_status_logs", zoneId];

export function useMapZonesQuery() {
  return useQuery({
    queryKey: ZONES_KEY,
    queryFn: async (): Promise<DbMapZone[]> => {
      const { data, error } = await supabase
        .from("map_zones")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        status: row.status as TerritoryStatus,
        polygon: row.polygon as unknown as [number, number][],
      }));
    },
  });
}

export function useZoneLogsQuery(zoneId: string | null) {
  return useQuery({
    queryKey: LOGS_KEY(zoneId ?? ""),
    enabled: !!zoneId,
    queryFn: async (): Promise<DbStatusLog[]> => {
      const { data, error } = await supabase
        .from("map_zone_status_logs")
        .select("*")
        .eq("zone_id", zoneId!)
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zone: {
      name: string;
      city: string;
      status: TerritoryStatus;
      rep_id: string;
      planned_date: string;
      notes: string;
      polygon: [number, number][];
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from("map_zones")
        .insert({
          name: zone.name,
          city: zone.city,
          status: zone.status,
          rep_id: zone.rep_id,
          planned_date: zone.planned_date,
          notes: zone.notes,
          polygon: zone.polygon as unknown as import("@/integrations/supabase/types").Json,
          created_by: zone.created_by,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ZONES_KEY }),
  });
}

export function useUpdateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
      statusChange,
    }: {
      id: string;
      updates: Partial<{
        name: string;
        city: string;
        status: string;
        rep_id: string;
        planned_date: string;
        notes: string;
      }>;
      statusChange?: { previous: string; next: string; changedBy: string };
    }) => {
      const { error } = await supabase.from("map_zones").update(updates).eq("id", id);
      if (error) throw error;

      if (statusChange) {
        const { error: logError } = await supabase.from("map_zone_status_logs").insert({
          zone_id: id,
          previous_status: statusChange.previous,
          new_status: statusChange.next,
          changed_by: statusChange.changedBy,
        });
        if (logError) throw logError;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ZONES_KEY }),
  });
}

export function useDeleteZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("map_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ZONES_KEY }),
  });
}
