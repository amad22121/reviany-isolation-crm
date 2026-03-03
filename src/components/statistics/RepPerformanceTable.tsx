import { useMemo, useState } from "react";
import { Appointment, SALES_REPS } from "@/data/crm-data";
import { ChevronUp, ChevronDown } from "lucide-react";
import { computeRepPerf, RepPerf } from "@/lib/statistics/statsHelpers";

interface Props {
  appointments: Appointment[];
  prevAppointments: Appointment[];
  onRepClick?: (rep: RepPerf) => void;
}

type SortKey = "name" | "total" | "confirmed" | "closed" | "closingRate" | "confirmRate" | "cancelRate" | "noShowRate";

const RepPerformanceTable = ({ appointments, prevAppointments, onRepClick }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>("closingRate");
  const [sortAsc, setSortAsc] = useState(false);

  const data = useMemo(() => computeRepPerf(appointments, prevAppointments), [appointments, prevAppointments]);

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [data, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  };

  const ScoreDot = ({ score }: { score: "elite" | "stable" | "improve" }) => {
    const map = { elite: "🟢", stable: "🟡", improve: "🔴" };
    return <span className="text-xs">{map[score]}</span>;
  };

  const cols: { key: SortKey; label: string }[] = [
    { key: "name", label: "Représentant" },
    { key: "total", label: "Total" },
    { key: "confirmed", label: "Conf." },
    { key: "closed", label: "Closés" },
    { key: "confirmRate", label: "Conf. %" },
    { key: "closingRate", label: "Closing %" },
    { key: "cancelRate", label: "Annul. %" },
    { key: "noShowRate", label: "No-show %" },
  ];

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">Performance par représentant</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              {cols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="px-2 py-2.5 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {col.label}
                  <SortIcon col={col.key} />
                </th>
              ))}
              <th className="px-2 py-2.5 text-left font-medium text-muted-foreground">Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRepClick?.(row)}
                className="border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer"
              >
                <td className="px-2 py-2.5 font-medium text-foreground whitespace-nowrap">{row.name}</td>
                <td className="px-2 py-2.5 text-foreground">{row.total}</td>
                <td className="px-2 py-2.5 text-green-400">{row.confirmed}</td>
                <td className="px-2 py-2.5 text-info">{row.closed}</td>
                <td className="px-2 py-2.5 font-semibold text-foreground">{row.confirmRate}%</td>
                <td className="px-2 py-2.5 font-semibold text-foreground">{row.closingRate}%</td>
                <td className="px-2 py-2.5 text-amber-400">{row.cancelRate}%</td>
                <td className="px-2 py-2.5 text-red-400">{row.noShowRate}%</td>
                <td className="px-2 py-2.5"><ScoreDot score={row.score} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RepPerformanceTable;
