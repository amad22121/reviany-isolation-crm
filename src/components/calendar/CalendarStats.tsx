import { CalendarCheck, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

interface CalendarStatsProps {
  total: number;
  confirmed: number;
  atRisk: number;
  closingRate: number;
  dateLabel: string;
}

const CalendarStats = ({ total, confirmed, atRisk, closingRate, dateLabel }: CalendarStatsProps) => (
  <div>
    <h2 className="text-sm font-medium text-muted-foreground mb-3">
      Vue du jour — <span className="text-foreground capitalize">{dateLabel}</span>
    </h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: "RDV", sub: "Total planifiés", value: total, icon: CalendarCheck, color: "text-primary" },
        { label: "Confirmés", sub: "Clients confirmés", value: confirmed, icon: CheckCircle2, color: "text-green-400" },
        { label: "À risque", sub: "Non confirmés", value: atRisk, icon: AlertTriangle, color: "text-destructive" },
        { label: "Ventes (%)", sub: "Taux de closing", value: `${closingRate}%`, icon: TrendingUp, color: "text-info" },
      ].map((s) => (
        <div key={s.label} className="glass-card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-secondary-foreground">{s.label}</span>
            <s.icon className={`h-4 w-4 ${s.color}`} />
          </div>
          <div className="text-[10px] text-muted-foreground mb-2">{s.sub}</div>
          <div className="text-2xl font-bold text-foreground">{s.value}</div>
        </div>
      ))}
    </div>
  </div>
);

export default CalendarStats;
