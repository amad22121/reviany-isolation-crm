import { Appointment } from "@/data/crm-data";
import { MarketingLead } from "@/hooks/useMarketingLeads";
import {
  CalendarCheck, CheckCircle2, AlertTriangle, XCircle, Lock, TrendingUp,
  Percent, Users, ArrowUpRight, Clock, CalendarOff, PhoneOff, RotateCcw, Ban,
  TrendingDown, Minus,
} from "lucide-react";
import { computeStatusCounts, pct, variation } from "@/lib/statistics/statsHelpers";

interface Props {
  appointments: Appointment[];
  leads: MarketingLead[];
  prevAppointments?: Appointment[];
  prevLeads?: MarketingLead[];
  showComparison: boolean;
  onCardClick?: (key: string, label: string) => void;
}

const VariationBadge = ({ value }: { value: number | undefined }) => {
  if (value === undefined) return null;
  const positive = value > 0;
  const neutral = value === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${neutral ? "text-muted-foreground" : positive ? "text-green-400" : "text-red-400"}`}>
      {neutral ? <Minus className="h-2.5 w-2.5" /> : positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {value > 0 ? "+" : ""}{value}%
    </span>
  );
};

const KpiCards = ({ appointments, leads, prevAppointments = [], prevLeads = [], showComparison, onCardClick }: Props) => {
  const c = computeStatusCounts(appointments);
  const p = computeStatusCounts(prevAppointments);

  const statusCards = [
    { key: "total", label: "Total RDV", value: c.total, prev: p.total, icon: CalendarCheck, color: "text-primary" },
    { key: "confirmed", label: "Confirmés", value: c.confirmed, prev: p.confirmed, icon: CheckCircle2, color: "text-green-400" },
    { key: "unconfirmed", label: "Non confirmés", value: c.unconfirmed, prev: p.unconfirmed, icon: Clock, color: "text-yellow-400" },
    { key: "atRisk", label: "À risque", value: c.atRisk, prev: p.atRisk, icon: AlertTriangle, color: "text-orange-400" },
    { key: "postponed", label: "Reportés", value: c.postponed, prev: p.postponed, icon: RotateCcw, color: "text-blue-400" },
    { key: "cancelledCb", label: "Annulés (rappeler)", value: c.cancelledCb, prev: p.cancelledCb, icon: PhoneOff, color: "text-amber-400" },
    { key: "cancelledFinal", label: "Annulés (définitif)", value: c.cancelledFinal, prev: p.cancelledFinal, icon: Ban, color: "text-muted-foreground" },
    { key: "noShow", label: "No-show", value: c.noShow, prev: p.noShow, icon: CalendarOff, color: "text-red-400" },
    { key: "closed", label: "Closés", value: c.closed, prev: p.closed, icon: Lock, color: "text-info" },
  ];

  const totalLeads = leads.length;
  const bookedLeads = leads.filter((l) => l.status === "Appointment Booked" || l.status === "Closed").length;
  const conversionRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;

  const derivedCards = [
    { key: "confirmRate", label: "Taux confirmation", value: pct(c.confirmed, c.total), prev: pct(p.confirmed, p.total), icon: Percent, color: "text-green-400", suffix: "%" },
    { key: "closingRate", label: "Taux closing", value: pct(c.closed, c.total), prev: pct(p.closed, p.total), icon: TrendingUp, color: "text-info", suffix: "%" },
    { key: "noShowRate", label: "Taux no-show", value: pct(c.noShow, c.total), prev: pct(p.noShow, p.total), icon: CalendarOff, color: "text-red-400", suffix: "%" },
    { key: "cancelCbRate", label: "Taux annul. (rappeler)", value: pct(c.cancelledCb, c.total), prev: pct(p.cancelledCb, p.total), icon: PhoneOff, color: "text-amber-400", suffix: "%" },
    { key: "leads", label: "Marketing Leads", value: totalLeads, prev: prevLeads.length, icon: Users, color: "text-primary" },
    { key: "leadConv", label: "Conversion Leads", value: conversionRate, prev: 0, icon: ArrowUpRight, color: "text-warning", suffix: "%" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {statusCards.map((c) => (
          <div
            key={c.key}
            onClick={() => onCardClick?.(c.key, c.label)}
            className="glass-card p-3 cursor-pointer hover:bg-secondary/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground leading-tight">{c.label}</span>
              <c.icon className={`h-3.5 w-3.5 ${c.color} shrink-0`} />
            </div>
            <div className="text-xl font-bold text-foreground">{c.value}</div>
            {showComparison && <VariationBadge value={variation(c.value, c.prev)} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {derivedCards.map((c) => (
          <div
            key={c.key}
            onClick={() => onCardClick?.(c.key, c.label)}
            className="glass-card p-3 cursor-pointer hover:bg-secondary/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground leading-tight">{c.label}</span>
              <c.icon className={`h-3.5 w-3.5 ${c.color} shrink-0`} />
            </div>
            <div className="text-xl font-bold text-foreground">{c.value}{c.suffix || ""}</div>
            {showComparison && <VariationBadge value={variation(c.value, c.prev)} />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KpiCards;
