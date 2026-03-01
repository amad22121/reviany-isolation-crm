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
  Clock,
  CalendarOff,
  PhoneOff,
  RotateCcw,
  Ban,
} from "lucide-react";

interface Props {
  appointments: Appointment[];
  leads: MarketingLead[];
}

const KpiCards = ({ appointments, leads }: Props) => {
  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === "Confirmé").length;
  const unconfirmed = appointments.filter((a) => a.status === "Non confirmé").length;
  const atRisk = appointments.filter((a) => a.status === "À risque").length;
  const postponed = appointments.filter((a) => a.status === "Reporté").length;
  const cancelledCallback = appointments.filter((a) => a.status === "Annulé (à rappeler)").length;
  const cancelledFinal = appointments.filter((a) => a.status === "Annulé (définitif)").length;
  const noShow = appointments.filter((a) => a.status === "No-show").length;
  const closed = appointments.filter((a) => a.status === "Closé").length;

  const pct = (n: number) => total > 0 ? (n / total * 100).toFixed(1) : "0.0";

  const totalLeads = leads.length;
  const bookedLeads = leads.filter((l) => l.status === "Appointment Booked" || l.status === "Closed").length;
  const conversionRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;

  const statusCards = [
    { label: "Total RDV", value: total, icon: CalendarCheck, color: "text-primary" },
    { label: "Confirmés", value: confirmed, icon: CheckCircle2, color: "text-green-400" },
    { label: "Non confirmés", value: unconfirmed, icon: Clock, color: "text-yellow-400" },
    { label: "À risque", value: atRisk, icon: AlertTriangle, color: "text-orange-400" },
    { label: "Reportés", value: postponed, icon: RotateCcw, color: "text-blue-400" },
    { label: "Annulés (rappeler)", value: cancelledCallback, icon: PhoneOff, color: "text-amber-400" },
    { label: "Annulés (définitif)", value: cancelledFinal, icon: Ban, color: "text-muted-foreground" },
    { label: "No-show", value: noShow, icon: CalendarOff, color: "text-red-400" },
    { label: "Closés", value: closed, icon: Lock, color: "text-info" },
  ];

  const derivedCards = [
    { label: "Taux confirmation", value: `${pct(confirmed)}%`, icon: Percent, color: "text-green-400" },
    { label: "Taux closing", value: `${pct(closed)}%`, icon: TrendingUp, color: "text-info" },
    { label: "Taux no-show", value: `${pct(noShow)}%`, icon: CalendarOff, color: "text-red-400" },
    { label: "Taux annul. (rappeler)", value: `${pct(cancelledCallback)}%`, icon: PhoneOff, color: "text-amber-400" },
    { label: "Marketing Leads", value: totalLeads, icon: Users, color: "text-primary" },
    { label: "Conversion Leads", value: `${conversionRate}%`, icon: ArrowUpRight, color: "text-warning" },
  ];

  return (
    <div className="space-y-3">
      {/* Row 1: Status counts */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {statusCards.map((c) => (
          <div key={c.label} className="glass-card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground leading-tight">{c.label}</span>
              <c.icon className={`h-3.5 w-3.5 ${c.color} shrink-0`} />
            </div>
            <div className="text-xl font-bold text-foreground">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Derived metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {derivedCards.map((c) => (
          <div key={c.label} className="glass-card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground leading-tight">{c.label}</span>
              <c.icon className={`h-3.5 w-3.5 ${c.color} shrink-0`} />
            </div>
            <div className="text-xl font-bold text-foreground">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KpiCards;
