import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Appointment } from "@/data/crm-data";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { computeStatusCounts, pct, variation } from "@/lib/statistics/statsHelpers";

interface Props {
  open: boolean;
  onClose: () => void;
  kpiKey: string;
  label: string;
  currentAppts: Appointment[];
  prevAppts: Appointment[];
}

function getKpiValues(key: string, appts: Appointment[]): number {
  const c = computeStatusCounts(appts);
  const map: Record<string, number> = {
    total: c.total,
    confirmed: c.confirmed,
    unconfirmed: c.unconfirmed,
    atRisk: c.atRisk,
    postponed: c.postponed,
    cancelledCb: c.cancelledCb,
    cancelledFinal: c.cancelledFinal,
    noShow: c.noShow,
    closed: c.closed,
    confirmRate: pct(c.confirmed, c.total),
    closingRate: pct(c.closed, c.total),
    noShowRate: pct(c.noShow, c.total),
    cancelCbRate: pct(c.cancelledCb, c.total),
  };
  return map[key] ?? 0;
}

const isRateKey = (k: string) => k.endsWith("Rate");

const VariationBadge = ({ value }: { value: number | undefined }) => {
  if (value === undefined) return null;
  const positive = value > 0;
  const neutral = value === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${neutral ? "text-muted-foreground" : positive ? "text-green-400" : "text-red-400"}`}>
      {neutral ? <Minus className="h-3 w-3" /> : positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {value > 0 ? "+" : ""}{value}%
    </span>
  );
};

const KpiDetailPanel = ({ open, onClose, kpiKey, label, currentAppts, prevAppts }: Props) => {
  const { data: teamMembers = [] } = useTeamMembers();
  const currentVal = getKpiValues(kpiKey, currentAppts);
  const prevVal = getKpiValues(kpiKey, prevAppts);
  const varPct = variation(currentVal, prevVal);
  const suffix = isRateKey(kpiKey) ? "%" : "";

  // Breakdown by rep
  const repBreakdown = teamMembers.map((rep) => {
    const curr = getKpiValues(kpiKey, currentAppts.filter((a) => a.repId === rep.id));
    const prev = getKpiValues(kpiKey, prevAppts.filter((a) => a.repId === rep.id));
    return { name: rep.name, current: curr, previous: prev, variation: variation(curr, prev) };
  }).filter((r) => r.current > 0 || r.previous > 0);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[400px] sm:w-[480px] bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">{label}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Période actuelle</p>
              <p className="text-2xl font-bold text-foreground">{currentVal}{suffix}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Période précédente</p>
              <p className="text-2xl font-bold text-muted-foreground">{prevVal}{suffix}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Variation</p>
              <div className="mt-1"><VariationBadge value={varPct} /></div>
            </div>
          </div>

          {/* Rep breakdown */}
          {repBreakdown.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-3">Par représentant</h4>
              <div className="space-y-1">
                {repBreakdown.map((r) => (
                  <div key={r.name} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-secondary/30 transition-colors">
                    <span className="text-xs font-medium text-foreground">{r.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-foreground font-semibold">{r.current}{suffix}</span>
                      <span className="text-[10px] text-muted-foreground">vs {r.previous}{suffix}</span>
                      <VariationBadge value={r.variation} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {repBreakdown.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée de représentant pour cette période</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default KpiDetailPanel;
