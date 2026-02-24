import { SALES_REPS } from "@/data/crm-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRange } from "@/pages/StatisticsPage";

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "this_week", label: "Cette semaine" },
  { value: "last_week", label: "Semaine dernière" },
  { value: "this_month", label: "Ce mois" },
  { value: "custom", label: "Personnalisé" },
];

interface Props {
  isRep: boolean;
  dateRange: DateRange;
  onDateRangeChange: (v: DateRange) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
  selectedRepId: string;
  onRepChange: (v: string) => void;
  selectedSource: string;
  onSourceChange: (v: string) => void;
}

const StatisticsFilters = ({
  isRep,
  dateRange,
  onDateRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  selectedRepId,
  onRepChange,
  selectedSource,
  onSourceChange,
}: Props) => (
  <div className="flex flex-wrap items-end gap-3">
    <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as DateRange)}>
      <SelectTrigger className="w-[170px] h-9 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DATE_RANGES.map((r) => (
          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>

    {dateRange === "custom" && (
      <>
        <input
          type="date"
          value={customStart}
          onChange={(e) => onCustomStartChange(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground"
        />
        <span className="text-xs text-muted-foreground">→</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => onCustomEndChange(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground"
        />
      </>
    )}

    {!isRep && (
      <Select value={selectedRepId} onValueChange={onRepChange}>
        <SelectTrigger className="w-[160px] h-9 text-xs">
          <SelectValue placeholder="Représentant" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les reps</SelectItem>
          {SALES_REPS.map((r) => (
            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}

    <Select value={selectedSource} onValueChange={onSourceChange}>
      <SelectTrigger className="w-[140px] h-9 text-xs">
        <SelectValue placeholder="Source" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toutes sources</SelectItem>
        <SelectItem value="Facebook">Facebook</SelectItem>
        <SelectItem value="Door-to-door">Door-to-door</SelectItem>
        <SelectItem value="Referral">Referral</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export default StatisticsFilters;
