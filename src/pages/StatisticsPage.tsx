import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/store/crm-store";
import { Appointment } from "@/data/crm-data";
import { useAppointments } from "@/hooks/useAppointments";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useMarketingLeadsQuery, MarketingLead } from "@/hooks/useMarketingLeads";
import { can } from "@/lib/permissions/can";
import { getPreviousPeriod, computeRepPerf, RepPerf, pct } from "@/lib/statistics/statsHelpers";
import StatisticsFilters from "@/components/statistics/StatisticsFilters";
import KpiCards from "@/components/statistics/KpiCards";
import StatusChart from "@/components/statistics/StatusChart";
import RepPerformanceTable from "@/components/statistics/RepPerformanceTable";
import LeadsPerformance from "@/components/statistics/LeadsPerformance";
import DetailedAppointmentTable from "@/components/statistics/DetailedAppointmentTable";
import KpiDetailPanel from "@/components/statistics/KpiDetailPanel";
import RepDetailPanel from "@/components/statistics/RepDetailPanel";
import RevenueSection from "@/components/statistics/RevenueSection";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type DateRange = "this_week" | "last_week" | "this_month" | "custom";

function getDateRange(range: DateRange, customStart?: string, customEnd?: string): [string, string] {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  if (range === "this_week") {
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return [fmt(mon), fmt(sun)];
  }
  if (range === "last_week") {
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - day + (day === 0 ? -6 : 1) - 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return [fmt(mon), fmt(sun)];
  }
  if (range === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [fmt(start), fmt(end)];
  }
  return [customStart || fmt(now), customEnd || fmt(now)];
}

const StatisticsPage = () => {
  const { appointments, hotCalls } = useCrm();
  const { role, currentRepId, currentManagerId } = useAuth();
  const { data: leads = [] } = useMarketingLeadsQuery();
  const { data: teamMembers = [] } = useTeamMembers();
  const isRep = role === "representant";
  const canSeeRevenue = can(role, "view_all_appointments"); // owner/manager

  const [dateRange, setDateRange] = useState<DateRange>("this_week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedRepId, setSelectedRepId] = useState<string>(isRep ? (currentRepId || "") : "all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [showComparison, setShowComparison] = useState(false);

  // Panels
  const [kpiPanel, setKpiPanel] = useState<{ key: string; label: string } | null>(null);
  const [repPanel, setRepPanel] = useState<RepPerf | null>(null);

  const [startDate, endDate] = getDateRange(dateRange, customStart, customEnd);
  const [prevStart, prevEnd] = getPreviousPeriod(startDate, endDate);

  // Filter appointments by role
  const roleFilteredAppts = useMemo(() => {
    let appts = appointments.filter((a) => a.status !== "Backlog");
    if (isRep) return appts.filter((a) => a.repId === currentRepId);
    if (role === "gestionnaire" && teamMembers.length > 0) {
      const reps = new Set(teamMembers.filter((r) => r.role === "representant").map((r) => r.id));
      return appts.filter((a) => reps.has(a.repId));
    }
    return appts;
  }, [appointments, role, currentRepId, currentManagerId, isRep]);

  const applyFilters = (appts: Appointment[], start: string, end: string) =>
    appts
      .filter((a) => a.date >= start && a.date <= end)
      .filter((a) => selectedRepId === "all" || a.repId === selectedRepId)
      .filter((a) => selectedSource === "all" || a.source === selectedSource);

  const filteredAppts = useMemo(() => applyFilters(roleFilteredAppts, startDate, endDate), [roleFilteredAppts, startDate, endDate, selectedRepId, selectedSource]);
  const prevAppts = useMemo(() => applyFilters(roleFilteredAppts, prevStart, prevEnd), [roleFilteredAppts, prevStart, prevEnd, selectedRepId, selectedSource]);

  const filterLeads = (l: MarketingLead[], start: string, end: string) => {
    let filtered = l;
    if (isRep) filtered = filtered.filter((lead) => lead.assigned_rep_id === currentRepId);
    else if (role === "gestionnaire" && teamMembers.length > 0) {
      const reps = new Set(teamMembers.filter((r) => r.role === "representant").map((r) => r.id));
      filtered = filtered.filter((lead) => lead.assigned_rep_id && reps.has(lead.assigned_rep_id));
    }
    return filtered
      .filter((lead) => { const d = lead.created_at.split("T")[0]; return d >= start && d <= end; })
      .filter((lead) => selectedRepId === "all" || lead.assigned_rep_id === selectedRepId)
      .filter((lead) => selectedSource === "all" || lead.source === selectedSource);
  };

  const filteredLeads = useMemo(() => filterLeads(leads as MarketingLead[], startDate, endDate), [leads, startDate, endDate, selectedRepId, selectedSource, isRep, currentRepId, role, currentManagerId]);
  const prevLeads = useMemo(() => filterLeads(leads as MarketingLead[], prevStart, prevEnd), [leads, prevStart, prevEnd, selectedRepId, selectedSource, isRep, currentRepId, role, currentManagerId]);

  // Team averages for rep detail panel
  const repPerfs = useMemo(() => computeRepPerf(filteredAppts, prevAppts, teamMembers), [filteredAppts, prevAppts, teamMembers]);
  const teamAvg = useMemo(() => {
    const active = repPerfs.filter((r) => r.total > 0);
    if (active.length === 0) return { confirmRate: 0, closingRate: 0, cancelRate: 0, noShowRate: 0 };
    return {
      confirmRate: Math.round(active.reduce((s, r) => s + r.confirmRate, 0) / active.length * 10) / 10,
      closingRate: Math.round(active.reduce((s, r) => s + r.closingRate, 0) / active.length * 10) / 10,
      cancelRate: Math.round(active.reduce((s, r) => s + r.cancelRate, 0) / active.length * 10) / 10,
      noShowRate: Math.round(active.reduce((s, r) => s + r.noShowRate, 0) / active.length * 10) / 10,
    };
  }, [repPerfs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Revenue & Performance</h1>
        <div className="flex items-center gap-2">
          <Switch id="compare" checked={showComparison} onCheckedChange={setShowComparison} />
          <Label htmlFor="compare" className="text-xs text-muted-foreground cursor-pointer">Comparer période</Label>
        </div>
      </div>

      <StatisticsFilters
        isRep={isRep}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        selectedRepId={selectedRepId}
        onRepChange={setSelectedRepId}
        selectedSource={selectedSource}
        onSourceChange={setSelectedSource}
      />

      {filteredAppts.length === 0 && filteredLeads.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <TrendingUp className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Aucune donnée pour la période sélectionnée</p>
            <p className="text-muted-foreground text-xs">Ajoutez des rendez-vous pour voir les statistiques apparaître ici.</p>
          </div>
        </div>
      )}

      <KpiCards
        appointments={filteredAppts}
        leads={filteredLeads}
        prevAppointments={prevAppts}
        prevLeads={prevLeads}
        showComparison={showComparison}
        onCardClick={(key, label) => setKpiPanel({ key, label })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart appointments={filteredAppts} />
        <LeadsPerformance leads={filteredLeads} />
      </div>

      {/* Revenue — Owner/Manager only */}
      {canSeeRevenue && (
        <RevenueSection appointments={filteredAppts} prevAppointments={prevAppts} />
      )}

      {!isRep && (
        <RepPerformanceTable
          appointments={filteredAppts}
          prevAppointments={prevAppts}
          onRepClick={(rep) => setRepPanel(rep)}
        />
      )}

      <DetailedAppointmentTable appointments={filteredAppts} />

      {/* Panels */}
      <KpiDetailPanel
        open={!!kpiPanel}
        onClose={() => setKpiPanel(null)}
        kpiKey={kpiPanel?.key || "total"}
        label={kpiPanel?.label || ""}
        currentAppts={filteredAppts}
        prevAppts={prevAppts}
      />

      <RepDetailPanel
        open={!!repPanel}
        onClose={() => setRepPanel(null)}
        rep={repPanel}
        teamAvg={teamAvg}
      />
    </div>
  );
};

export default StatisticsPage;
