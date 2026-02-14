import { useMemo, useState } from "react";
import { useCrm } from "@/store/crm-store";
import { SALES_REPS } from "@/data/crm-data";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Target,
  Plus,
  Bell,
} from "lucide-react";

const DAILY_TARGET = 8;

const DashboardPage = () => {
  const { appointments, updateStatus } = useCrm();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"today" | "week">("today");

  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const filtered = useMemo(() => {
    if (filter === "today") return appointments.filter((a) => a.date === today);
    return appointments.filter((a) => new Date(a.date) >= weekStart);
  }, [appointments, filter, today]);

  const stats = useMemo(() => {
    const todayAppts = appointments.filter((a) => a.date === today);
    return {
      total: todayAppts.length,
      confirmed: todayAppts.filter((a) => a.status === "Confirmed" || a.status === "Completed").length,
      noShows: todayAppts.filter((a) => a.status === "No-Show").length,
    };
  }, [appointments, today]);

  const getRepName = (repId: string) => SALES_REPS.find((r) => r.id === repId)?.name || repId;

  const statusColors: Record<string, string> = {
    Pending: "bg-warning/20 text-warning",
    Confirmed: "bg-primary/20 text-primary",
    "No-Show": "bg-destructive/20 text-destructive",
    Completed: "bg-info/20 text-info",
    Cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Appointments Today", value: stats.total, icon: CalendarCheck, color: "text-primary" },
          { label: "Confirmed Today", value: stats.confirmed, icon: CheckCircle2, color: "text-primary" },
          { label: "No-Shows", value: stats.noShows, icon: XCircle, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Daily Target</span>
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.total}/{DAILY_TARGET}</div>
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (stats.total / DAILY_TARGET) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["today", "week"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {f === "today" ? "Today" : "This Week"}
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate("/add-appointment")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Appointment
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Client", "Phone", "Address", "Time", "Rep", "Status", "Notes", "SMS"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{a.clientFirstName} {a.clientLastName}</td>
                  <td className="px-4 py-3 text-foreground">{a.phone}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      {a.address.substring(0, 35)}…
                    </a>
                  </td>
                  <td className="px-4 py-3 text-foreground">{a.time}</td>
                  <td className="px-4 py-3 text-foreground">{getRepName(a.repId)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">{a.notes}</td>
                  <td className="px-4 py-3">
                    {a.smsScheduled && (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <Bell className="h-3 w-3" /> Scheduled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No appointments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
