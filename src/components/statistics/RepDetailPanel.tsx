import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RepPerf, variation } from "@/lib/statistics/statsHelpers";

interface Props {
  open: boolean;
  onClose: () => void;
  rep: RepPerf | null;
  teamAvg: { confirmRate: number; closingRate: number; cancelRate: number; noShowRate: number };
}

const Var = ({ curr, prev }: { curr: number; prev?: number }) => {
  if (prev === undefined) return null;
  const v = variation(curr, prev);
  if (v === undefined) return null;
  const neutral = v === 0;
  const positive = v > 0;
  return (
    <span className={`text-[10px] font-medium ${neutral ? "text-muted-foreground" : positive ? "text-green-400" : "text-red-400"}`}>
      {neutral ? "=" : positive ? <>{`+${v}%`}</> : <>{`${v}%`}</>}
    </span>
  );
};

const VsAvg = ({ value, avg, invert = false }: { value: number; avg: number; invert?: boolean }) => {
  const diff = Math.round((value - avg) * 10) / 10;
  const better = invert ? diff < 0 : diff > 0;
  const neutral = diff === 0;
  return (
    <span className={`text-[10px] font-medium ${neutral ? "text-muted-foreground" : better ? "text-green-400" : "text-red-400"}`}>
      {diff > 0 ? "+" : ""}{diff}% vs moy.
    </span>
  );
};

const ScoreBadge = ({ score }: { score: "elite" | "stable" | "improve" }) => {
  const map = {
    elite: { emoji: "🟢", label: "Elite", color: "text-green-400" },
    stable: { emoji: "🟡", label: "Stable", color: "text-yellow-400" },
    improve: { emoji: "🔴", label: "À améliorer", color: "text-red-400" },
  };
  const s = map[score];
  return <span className={`text-sm font-semibold ${s.color}`}>{s.emoji} {s.label}</span>;
};

const RepDetailPanel = ({ open, onClose, rep, teamAvg }: Props) => {
  if (!rep) return null;

  const metrics = [
    { label: "Taux confirmation", value: rep.confirmRate, prev: rep.prevConfirmRate, avg: teamAvg.confirmRate },
    { label: "Taux closing", value: rep.closingRate, prev: rep.prevClosingRate, avg: teamAvg.closingRate },
    { label: "Taux annulation", value: rep.cancelRate, prev: rep.prevCancelRate, avg: teamAvg.cancelRate, invert: true },
    { label: "Taux no-show", value: rep.noShowRate, prev: rep.prevNoShowRate, avg: teamAvg.noShowRate, invert: true },
  ];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[400px] sm:w-[480px] bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">{rep.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary */}
          <div className="glass-card p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">Résumé</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total RDV", value: rep.total },
                { label: "Confirmés", value: rep.confirmed },
                { label: "Closés", value: rep.closed },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-bold text-foreground">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Score */}
          <div className="glass-card p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Score Performance</span>
            <ScoreBadge score={rep.score} />
          </div>

          {/* Metrics with comparison */}
          <div className="glass-card p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">Métriques détaillées</h4>
            <div className="space-y-3">
              {metrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <span className="text-xs text-foreground font-medium">{m.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{m.value}%</span>
                    <Var curr={m.value} prev={m.prev} />
                    <VsAvg value={m.value} avg={m.avg} invert={m.invert} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RepDetailPanel;
