import { useMemo, useState } from "react";
import { Appointment, SALES_REPS, HotCall } from "@/data/crm-data";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  appointments: Appointment[];
  hotCalls: HotCall[];
  startDate: string;
  endDate: string;
}

type SortKey = "name" | "total" | "confirmed" | "unconfirmed" | "atRisk" | "postponed" | "cancelledCb" | "cancelledFinal" | "noShow" | "closed" | "closingRate" | "confirmRate";

interface RepRow {
  name: string;
  total: number;
  confirmed: number;
  unconfirmed: number;
  atRisk: number;
  postponed: number;
  cancelledCb: number;
  cancelledFinal: number;
  noShow: number;
  closed: number;
  closingRate: number;
  confirmRate: number;
}

const RepPerformanceTable = ({ appointments }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>("closingRate");
  const [sortAsc, setSortAsc] = useState(false);

  const data: RepRow[] = useMemo(() => {
    return SALES_REPS.map((rep) => {
      const ra = appointments.filter((a) => a.repId === rep.id);
      const total = ra.length;
      const confirmed = ra.filter((a) => a.status === "Confirmé").length;
      const unconfirmed = ra.filter((a) => a.status === "Non confirmé").length;
      const atRisk = ra.filter((a) => a.status === "À risque").length;
      const postponed = ra.filter((a) => a.status === "Reporté").length;
      const cancelledCb = ra.filter((a) => a.status === "Annulé (à rappeler)").length;
      const cancelledFinal = ra.filter((a) => a.status === "Annulé (définitif)").length;
      const noShow = ra.filter((a) => a.status === "No-show").length;
      const closed = ra.filter((a) => a.status === "Closé").length;
      const closingRate = total > 0 ? Math.round((closed / total) * 100) : 0;
      const confirmRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
      return { name: rep.name, total, confirmed, unconfirmed, atRisk, postponed, cancelledCb, cancelledFinal, noShow, closed, closingRate, confirmRate };
    });
  }, [appointments]);

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
    { key: "total", label: "Total" },
    { key: "confirmed", label: "Conf." },
    { key: "unconfirmed", label: "Non conf." },
    { key: "atRisk", label: "À risque" },
    { key: "postponed", label: "Reportés" },
    { key: "cancelledCb", label: "Ann. (rapp.)" },
    { key: "cancelledFinal", label: "Ann. (déf.)" },
    { key: "noShow", label: "No-show" },
    { key: "closed", label: "Closés" },
    { key: "closingRate", label: "Closing %" },
    { key: "confirmRate", label: "Conf. %" },
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
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.name} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="px-2 py-2.5 font-medium text-foreground whitespace-nowrap">{row.name}</td>
                <td className="px-2 py-2.5 text-foreground">{row.total}</td>
                <td className="px-2 py-2.5 text-green-400">{row.confirmed}</td>
                <td className="px-2 py-2.5 text-yellow-400">{row.unconfirmed}</td>
                <td className="px-2 py-2.5 text-orange-400">{row.atRisk}</td>
                <td className="px-2 py-2.5 text-blue-400">{row.postponed}</td>
                <td className="px-2 py-2.5 text-amber-400">{row.cancelledCb}</td>
                <td className="px-2 py-2.5 text-muted-foreground">{row.cancelledFinal}</td>
                <td className="px-2 py-2.5 text-red-400">{row.noShow}</td>
                <td className="px-2 py-2.5 text-info">{row.closed}</td>
                <td className="px-2 py-2.5 font-semibold text-foreground">{row.closingRate}%</td>
                <td className="px-2 py-2.5 font-semibold text-foreground">{row.confirmRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RepPerformanceTable;
