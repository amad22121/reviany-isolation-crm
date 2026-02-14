import { useMemo, useState } from "react";
import { useCrm } from "@/store/crm-store";
import { SALES_REPS, Appointment } from "@/data/crm-data";
import { Search, MapPin, Bell } from "lucide-react";

const AppointmentsPage = () => {
  const { appointments } = useCrm();
  const [search, setSearch] = useState("");
  const [repFilter, setRepFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchSearch =
        !search ||
        `${a.clientFirstName} ${a.clientLastName}`.toLowerCase().includes(search.toLowerCase()) ||
        a.phone.includes(search) ||
        a.address.toLowerCase().includes(search.toLowerCase());
      const matchRep = repFilter === "all" || a.repId === repFilter;
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchRep && matchStatus;
    });
  }, [appointments, search, repFilter, statusFilter]);

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
      <h1 className="text-xl font-bold text-foreground">All Appointments</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search client, phone, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={repFilter}
          onChange={(e) => setRepFilter(e.target.value)}
        >
          <option value="all">All Reps</option>
          {SALES_REPS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          {["Pending", "Confirmed", "No-Show", "Completed", "Cancelled"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Client", "Phone", "Address", "Date/Time", "Rep", "Status", "Notes"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{a.clientFirstName} {a.clientLastName}</td>
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
                  <td className="px-4 py-3 text-foreground">{a.date} {a.time}</td>
                  <td className="px-4 py-3 text-foreground">{getRepName(a.repId)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate">
                    {a.notes}
                    {a.smsScheduled && (
                      <span className="ml-2 inline-flex items-center gap-1 text-primary">
                        <Bell className="h-3 w-3" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No appointments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
