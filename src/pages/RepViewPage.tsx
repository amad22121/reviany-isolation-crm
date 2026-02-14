import { useMemo } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS } from "@/data/crm-data";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Target, Plus, MapPin, Bell } from "lucide-react";

const DAILY_GOAL = 4;

const RepViewPage = () => {
  const { appointments } = useCrm();
  const { currentRepId } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const rep = SALES_REPS.find((r) => r.id === currentRepId);
  const todayAppts = useMemo(
    () => appointments.filter((a) => a.repId === currentRepId && a.date === today),
    [appointments, currentRepId, today]
  );

  const statusColors: Record<string, string> = {
    Pending: "bg-warning/20 text-warning",
    Confirmed: "bg-primary/20 text-primary",
    "No-Show": "bg-destructive/20 text-destructive",
    Completed: "bg-info/20 text-info",
    Cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Welcome, {rep?.name}</h1>
        <button
          onClick={() => navigate("/add-appointment")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Today's Appointments</span>
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{todayAppts.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Daily Goal</span>
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{todayAppts.length}/{DAILY_GOAL}</div>
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (todayAppts.length / DAILY_GOAL) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Today's Schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Time", "Client", "Phone", "Address", "Status", "Notes"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayAppts.sort((a, b) => a.time.localeCompare(b.time)).map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{a.time}</td>
                  <td className="px-4 py-3 text-foreground">{a.clientFirstName} {a.clientLastName}</td>
                  <td className="px-4 py-3 text-foreground">{a.phone}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      <MapPin className="h-3 w-3" /> View Map
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">
                    {a.notes}
                    {a.smsScheduled && <Bell className="inline h-3 w-3 ml-1 text-primary" />}
                  </td>
                </tr>
              ))}
              {todayAppts.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No appointments today</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RepViewPage;
