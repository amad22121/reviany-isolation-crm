import { Appointment } from "@/data/crm-data";
import type { TeamMember } from "@/hooks/useTeamMembers";

/** Period shift: given [start, end], compute [prevStart, prevEnd] of equal length. */
export function getPreviousPeriod(start: string, end: string): [string, string] {
  const s = new Date(start);
  const e = new Date(end);
  const diffMs = e.getTime() - s.getTime() + 86_400_000; // inclusive
  const prevEnd = new Date(s.getTime() - 86_400_000);
  const prevStart = new Date(prevEnd.getTime() - diffMs + 86_400_000);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return [fmt(prevStart), fmt(prevEnd)];
}

export interface KpiDef {
  key: string;
  label: string;
  value: number | string;
  prevValue?: number | string;
  variation?: number; // percentage
  color: string;
}

export function computeStatusCounts(appts: Appointment[]) {
  const total = appts.length;
  const confirmed = appts.filter((a) => a.status === "Confirmé").length;
  const unconfirmed = appts.filter((a) => a.status === "Non confirmé").length;
  const atRisk = appts.filter((a) => a.status === "À risque").length;
  const postponed = appts.filter((a) => a.status === "Reporté").length;
  const cancelledCb = appts.filter((a) => a.status === "Annulé (à rappeler)").length;
  const cancelledFinal = appts.filter((a) => a.status === "Annulé (définitif)").length;
  const noShow = appts.filter((a) => a.status === "No-show").length;
  const closed = appts.filter((a) => a.status === "Closé").length;
  return { total, confirmed, unconfirmed, atRisk, postponed, cancelledCb, cancelledFinal, noShow, closed };
}

export function pct(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
}

export function variation(current: number, previous: number): number | undefined {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export interface RepPerf {
  id: string;
  name: string;
  total: number;
  confirmed: number;
  closed: number;
  confirmRate: number;
  closingRate: number;
  cancelRate: number;
  noShowRate: number;
  revenue: number;
  avgDeal: number;
  // comparison
  prevConfirmRate?: number;
  prevClosingRate?: number;
  prevCancelRate?: number;
  prevNoShowRate?: number;
  score: "elite" | "stable" | "improve";
}

export function computeRepPerf(appts: Appointment[], prevAppts: Appointment[], reps: TeamMember[] = []): RepPerf[] {
  return reps.map((rep) => {
    const ra = appts.filter((a) => a.repId === rep.id);
    const pra = prevAppts.filter((a) => a.repId === rep.id);
    const total = ra.length;
    const confirmed = ra.filter((a) => a.status === "Confirmé").length;
    const closed = ra.filter((a) => a.status === "Closé").length;
    const cancelled = ra.filter((a) => a.status === "Annulé (à rappeler)" || a.status === "Annulé (définitif)").length;
    const noShow = ra.filter((a) => a.status === "No-show").length;
    const confirmRate = pct(confirmed, total);
    const closingRate = pct(closed, total);
    const cancelRate = pct(cancelled, total);
    const noShowRate = pct(noShow, total);
    const revenue = ra.reduce((s, a) => s + (a.closedValue || 0), 0);
    const closedAppts = ra.filter((a) => a.status === "Closé" && a.closedValue);
    const avgDeal = closedAppts.length > 0 ? Math.round(revenue / closedAppts.length) : 0;

    // Previous
    const pTotal = pra.length;
    const pConfirmed = pra.filter((a) => a.status === "Confirmé").length;
    const pClosed = pra.filter((a) => a.status === "Closé").length;
    const pCancelled = pra.filter((a) => a.status === "Annulé (à rappeler)" || a.status === "Annulé (définitif)").length;
    const pNoShow = pra.filter((a) => a.status === "No-show").length;

    // Score
    let score: "elite" | "stable" | "improve" = "stable";
    if (closingRate >= 30 && confirmRate >= 60) score = "elite";
    else if (closingRate < 15 || confirmRate < 30) score = "improve";

    return {
      id: rep.id,
      name: rep.name,
      total,
      confirmed,
      closed,
      confirmRate,
      closingRate,
      cancelRate,
      noShowRate,
      revenue,
      avgDeal,
      prevConfirmRate: pct(pConfirmed, pTotal),
      prevClosingRate: pct(pClosed, pTotal),
      prevCancelRate: pct(pCancelled, pTotal),
      prevNoShowRate: pct(pNoShow, pTotal),
      score,
    };
  });
}
