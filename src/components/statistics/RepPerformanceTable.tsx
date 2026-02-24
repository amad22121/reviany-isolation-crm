import { useMemo, useState } from "react";
import { Appointment, SALES_REPS, HotCall } from "@/data/crm-data";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  appointments: Appointment[];
  hotCalls: HotCall[];
  startDate: string;
  endDate: string;
}

type SortKey = "name" | "total" | "confirmed" | "closed" | "cancelled" | "closingRate" | "rebookings" | "followups";

interface RepRow {
  name: string;
  total: number;
  confirmed: number;
  closed: number;
  cancelled: number;
  closingRate: number;
  rebookings: number;
  followups: number;
}

const RepPerformanceTable = ({ appointments, hotCalls, startDate, endDate }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>("closingRate");
  const [sortAsc, setSortAsc] = useState(false);

  const data: RepRow[] = useMemo(() => {
    return SALES_REPS.map((rep) => {
      const repAppts = appointments.filter((a) => a.repId === rep.id);
      const total = repAppts.length;
      const confirmed = repAppts.filter((a) => a.status === "Confirmé").length;
      const closed = repAppts.filter((a) => a.status === "Closed").length;
      const cancelled = repAppts.filter((a) => a.status === "Annulé").length;
      const closingRate = total > 0 ? Math.round((closed / total) * 100) : 0;

      const repHC = hotCalls.filter((h) => h.repId === rep.id);
      const rebookings = repHC.filter((h) => h.status === "Booked").length;
      const followups = repHC.filter((h) => h.status.startsWith("Follow-up")).length;

      return { name: rep.name, total, confirmed, closed, cancelled, closingRate, rebookings, followups };
    });
  }, [appointments, hotCalls]);

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

  const cols: { key: SortKey; label: string }[] = [
    { key: "name", label: "Représentant" },
    { key: "total", label: "RDV" },
    { key: "confirmed", label: "Confirmés" },
    { key: "closed", label: "Closed" },
    { key: "cancelled", label: "Annulés" },
    { key: "closingRate", label: "Closing %" },
    { key: "rebookings", label: "Rebookings" },
    { key: "followups", label: "Follow-ups" },
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
                  className="px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {col.label}
                  <SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.name} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="px-3 py-2.5 font-medium text-foreground">{row.name}</td>
                <td className="px-3 py-2.5 text-foreground">{row.total}</td>
                <td className="px-3 py-2.5 text-green-400">{row.confirmed}</td>
                <td className="px-3 py-2.5 text-info">{row.closed}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.cancelled}</td>
                <td className="px-3 py-2.5 font-semibold text-foreground">{row.closingRate}%</td>
                <td className="px-3 py-2.5 text-foreground">{row.rebookings}</td>
                <td className="px-3 py-2.5 text-foreground">{row.followups}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RepPerformanceTable;
