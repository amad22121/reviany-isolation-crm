import { useMemo, useState } from "react";
import { useCrm, useAuth, AppRole } from "@/store/crm-store";
import { SALES_REPS, Appointment, AppointmentStatus } from "@/data/crm-data";
import { useMarketingLeadsQuery, MarketingLead } from "@/hooks/useMarketingLeads";
import StatisticsFilters from "@/components/statistics/StatisticsFilters";
import KpiCards from "@/components/statistics/KpiCards";
import StatusChart from "@/components/statistics/StatusChart";
import RepPerformanceTable from "@/components/statistics/RepPerformanceTable";
import LeadsPerformance from "@/components/statistics/LeadsPerformance";
import DetailedAppointmentTable from "@/components/statistics/DetailedAppointmentTable";

export type DateRange = "this_week" | "last_week" | "this_month" | "custom";

function getDateRange(range: DateRange, customStart?: string, customEnd?: string): [string, string] {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  // removed "today" option
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
  const isRep = role === "representant";

  const [dateRange, setDateRange] = useState<DateRange>("this_week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedRepId, setSelectedRepId] = useState<string>(isRep ? (currentRepId || "") : "all");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  const [startDate, endDate] = getDateRange(dateRange, customStart, customEnd);

  // Filter appointments by role
  const roleFilteredAppts = useMemo(() => {
    let appts = appointments.filter((a) => a.status !== "Backlog");
    if (isRep) return appts.filter((a) => a.repId === currentRepId);
    if (role === "gestionnaire" && currentManagerId) {
      const reps = new Set(SALES_REPS.filter((r) => r.managerId === currentManagerId).map((r) => r.id));
      return appts.filter((a) => reps.has(a.repId));
    }
    return appts;
  }, [appointments, role, currentRepId, currentManagerId, isRep]);

  // Apply date + rep + source filters
  const filteredAppts = useMemo(() => {
    return roleFilteredAppts
      .filter((a) => a.date >= startDate && a.date <= endDate)
      .filter((a) => selectedRepId === "all" || a.repId === selectedRepId)
      .filter((a) => selectedSource === "all" || a.source === selectedSource);
  }, [roleFilteredAppts, startDate, endDate, selectedRepId, selectedSource]);

  // Filter leads by date + rep + source
  const filteredLeads = useMemo(() => {
    let l = leads as MarketingLead[];
    if (isRep) l = l.filter((lead) => lead.assigned_rep_id === currentRepId);
    else if (role === "gestionnaire" && currentManagerId) {
      const reps = new Set(SALES_REPS.filter((r) => r.managerId === currentManagerId).map((r) => r.id));
      l = l.filter((lead) => lead.assigned_rep_id && reps.has(lead.assigned_rep_id));
    }
    return l
      .filter((lead) => {
        const d = lead.created_at.split("T")[0];
        return d >= startDate && d <= endDate;
      })
      .filter((lead) => selectedRepId === "all" || lead.assigned_rep_id === selectedRepId)
      .filter((lead) => selectedSource === "all" || lead.source === selectedSource);
  }, [leads, startDate, endDate, selectedRepId, selectedSource, isRep, currentRepId, role, currentManagerId]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Statistiques</h1>

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

      <KpiCards appointments={filteredAppts} leads={filteredLeads} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart appointments={filteredAppts} />
        <LeadsPerformance leads={filteredLeads} />
      </div>

      {!isRep && (
        <RepPerformanceTable
          appointments={filteredAppts}
          hotCalls={hotCalls}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      <DetailedAppointmentTable appointments={filteredAppts} />
    </div>
  );
};

export default StatisticsPage;
