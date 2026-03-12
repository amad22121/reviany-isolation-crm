import { useMemo } from "react";
import { Appointment } from "@/data/crm-data";
import { AppointmentStatus, APPOINTMENT_STATUS_LABELS } from "@/domain/enums";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Keys are AppointmentStatus enum values (what a.status actually contains).
const STATUS_COLORS: Record<string, string> = {
  [AppointmentStatus.PLANNED]:            "#facc15",
  [AppointmentStatus.CONFIRMED]:          "#4ade80",
  [AppointmentStatus.UNCONFIRMED]:        "#fdba74",
  [AppointmentStatus.AT_RISK]:            "#fb923c",
  [AppointmentStatus.POSTPONED]:          "#60a5fa",
  [AppointmentStatus.CANCELLED_CALLBACK]: "#f59e0b",
  [AppointmentStatus.CANCELLED_FINAL]:    "#6b7280",
  [AppointmentStatus.NO_SHOW]:            "#f87171",
  [AppointmentStatus.CLOSED]:             "#38bdf8",
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
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, value]) => ({
        status,                                              // enum value (for color lookup)
        name: APPOINTMENT_STATUS_LABELS[status as AppointmentStatus] ?? status, // French label
        value,
      }));
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
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#6b7280"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(220 18% 13%)",
              border: "1px solid hsl(220 14% 20%)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(210 20% 92%)",
            }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: "hsl(210 20% 92%)", fontSize: "11px" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusChart;
