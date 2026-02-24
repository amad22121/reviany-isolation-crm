import { useMemo } from "react";
import { Appointment } from "@/data/crm-data";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  "Confirmé": "#4ade80",
  "En attente": "#facc15",
  "À risque": "#fb923c",
  "Closed": "#60a5fa",
  "Annulé": "#6b7280",
};

interface Props {
  appointments: Appointment[];
}

const StatusChart = ({ appointments }: Props) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Répartition des statuts</h3>
        <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Répartition des statuts</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            dataKey="value"
            nameKey="name"
            paddingAngle={3}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || "#6b7280"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "hsl(220 18% 13%)", border: "1px solid hsl(220 14% 20%)", borderRadius: "8px", fontSize: "12px", color: "hsl(210 20% 92%)" }}
          />
          <Legend
            formatter={(value) => <span style={{ color: "hsl(210 20% 92%)", fontSize: "11px" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusChart;
