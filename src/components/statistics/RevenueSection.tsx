import { useMemo } from "react";
import { Appointment, SALES_REPS } from "@/data/crm-data";
import { DollarSign, TrendingUp, TrendingDown, Minus, BarChart3, Repeat } from "lucide-react";
import { variation } from "@/lib/statistics/statsHelpers";

interface Props {
  appointments: Appointment[];
  prevAppointments: Appointment[];
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

const fmt$ = (n: number) => new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const RevenueSection = ({ appointments, prevAppointments }: Props) => {
  const stats = useMemo(() => {
    const closed = appointments.filter((a) => a.status === "Closé");
    const prevClosed = prevAppointments.filter((a) => a.status === "Closé");
    const revenue = closed.reduce((s, a) => s + (a.closedValue || 0), 0);
    const prevRevenue = prevClosed.reduce((s, a) => s + (a.closedValue || 0), 0);
    const avgDeal = closed.length > 0 ? Math.round(revenue / closed.length) : 0;
    const recovered = closed.filter((a) => a.wasRecovered).reduce((s, a) => s + (a.closedValue || 0), 0);
    return { revenue, prevRevenue, avgDeal, recovered, closedCount: closed.length };
  }, [appointments, prevAppointments]);

  const revenueVar = variation(stats.revenue, stats.prevRevenue);

  const repRevenue = useMemo(() => {
    const closed = appointments.filter((a) => a.status === "Closé");
    return SALES_REPS.map((rep) => {
      const ra = closed.filter((a) => a.repId === rep.id);
      const rev = ra.reduce((s, a) => s + (a.closedValue || 0), 0);
      return {
        name: rep.name,
        count: ra.length,
        revenue: rev,
        avgDeal: ra.length > 0 ? Math.round(rev / ra.length) : 0,
        contribution: stats.revenue > 0 ? Math.round((rev / stats.revenue) * 100) : 0,
      };
    }).filter((r) => r.count > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [appointments, stats.revenue]);

  const cards = [
    { label: "Revenue Total", value: fmt$(stats.revenue), icon: DollarSign, sub: <VariationBadge value={revenueVar} /> },
    { label: "Valeur moy. deal", value: fmt$(stats.avgDeal), icon: BarChart3 },
    { label: "Revenue récupéré", value: fmt$(stats.recovered), icon: Repeat },
    { label: "# Closés", value: stats.closedCount, icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Analyse Revenue</h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground">{c.label}</span>
              <c.icon className="h-3.5 w-3.5 text-primary shrink-0" />
            </div>
            <div className="text-xl font-bold text-foreground">{c.value}</div>
            {c.sub && <div className="mt-1">{c.sub}</div>}
          </div>
        ))}
      </div>

      {repRevenue.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h4 className="text-xs font-semibold text-foreground">Revenue par représentant</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Rep</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground"># Closés</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Revenue</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Moy. Deal</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">% Contribution</th>
                </tr>
              </thead>
              <tbody>
                {repRevenue.map((r) => (
                  <tr key={r.name} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground">{r.name}</td>
                    <td className="px-3 py-2.5 text-foreground">{r.count}</td>
                    <td className="px-3 py-2.5 text-primary font-semibold">{fmt$(r.revenue)}</td>
                    <td className="px-3 py-2.5 text-foreground">{fmt$(r.avgDeal)}</td>
                    <td className="px-3 py-2.5 text-foreground">{r.contribution}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {repRevenue.length === 0 && (
        <div className="glass-card p-8 text-center">
          <DollarSign className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Aucun revenu enregistré pour cette période</p>
        </div>
      )}
    </div>
  );
};

export default RevenueSection;
