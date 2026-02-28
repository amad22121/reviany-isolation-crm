import { Appointment } from "@/data/crm-data";
import { MarketingLead } from "@/hooks/useMarketingLeads";
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  TrendingUp,
  Percent,
  Users,
  ArrowUpRight,
} from "lucide-react";

interface Props {
  appointments: Appointment[];
  leads: MarketingLead[];
}

const KpiCards = ({ appointments, leads }: Props) => {
  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === "Confirmé").length;
  const atRisk = appointments.filter((a) => a.status === "À risque").length;
  const closed = appointments.filter((a) => a.status === "Closé").length;
  const cancelled = appointments.filter((a) => a.status === "Annulé (à rappeler)" || a.status === "Annulé (définitif)").length;
  const closingRate = total > 0 ? Math.round((closed / total) * 100) : 0;
  const confirmRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  const totalLeads = leads.length;
  const bookedLeads = leads.filter((l) => l.status === "Appointment Booked" || l.status === "Closed").length;
  const conversionRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;

  const cards = [
    { label: "Total RDV", value: total, icon: CalendarCheck, color: "text-primary" },
    { label: "Confirmés", value: confirmed, icon: CheckCircle2, color: "text-green-400" },
    { label: "À risque", value: atRisk, icon: AlertTriangle, color: "text-orange-400" },
    { label: "Closed", value: closed, icon: Lock, color: "text-info" },
    { label: "Annulés", value: cancelled, icon: XCircle, color: "text-muted-foreground" },
    { label: "Taux closing", value: `${closingRate}%`, icon: TrendingUp, color: "text-info" },
    { label: "Taux confirmation", value: `${confirmRate}%`, icon: Percent, color: "text-green-400" },
    { label: "Marketing Leads", value: totalLeads, icon: Users, color: "text-primary" },
    { label: "Conversion Leads", value: `${conversionRate}%`, icon: ArrowUpRight, color: "text-warning" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <div className="text-2xl font-bold text-foreground">{c.value}</div>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
