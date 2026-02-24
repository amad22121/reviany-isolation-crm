import { MarketingLead } from "@/hooks/useMarketingLeads";
import { useMemo } from "react";

interface Props {
  leads: MarketingLead[];
}

const LeadsPerformance = ({ leads }: Props) => {
  const stats = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter((l) => l.status !== "New Lead").length;
    const booked = leads.filter((l) => l.status === "Appointment Booked" || l.status === "Closed").length;
    const closed = leads.filter((l) => l.status === "Closed").length;
    const notClosed = leads.filter((l) => l.status === "Not Closed").length;
    const convLead = total > 0 ? Math.round((booked / total) * 100) : 0;
    const convClose = booked > 0 ? Math.round((closed / booked) * 100) : 0;
    return { total, contacted, booked, closed, notClosed, convLead, convClose };
  }, [leads]);

  const rows = [
    { label: "Total Leads", value: stats.total },
    { label: "Contactés", value: stats.contacted },
    { label: "Booké (RDV)", value: stats.booked },
    { label: "Closed", value: stats.closed },
    { label: "Not Closed", value: stats.notClosed },
    { label: "Lead → RDV", value: `${stats.convLead}%` },
    { label: "RDV → Closed", value: `${stats.convClose}%` },
  ];

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Performance Leads</h3>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
            <span className="text-xs text-muted-foreground">{r.label}</span>
            <span className="text-sm font-semibold text-foreground">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadsPerformance;
