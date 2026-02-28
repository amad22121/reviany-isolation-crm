import { Appointment } from "@/data/crm-data";

const STATUS_COLORS: Record<string, string> = {
  "Planifié": "border-l-warning bg-warning/10",
  "Confirmé": "border-l-green-500 bg-green-500/10",
  "Non confirmé": "border-l-orange-300 bg-orange-300/10",
  "À risque": "border-l-orange-400 bg-orange-400/10",
  "Reporté": "border-l-blue-400 bg-blue-400/10",
  "Annulé (à rappeler)": "border-l-amber-500 bg-amber-500/10",
  "Annulé (définitif)": "border-l-muted-foreground bg-muted/30",
  "No-show": "border-l-red-400 bg-red-400/10",
  "Closé": "border-l-info bg-info/10",
};

const STATUS_BADGE: Record<string, string> = {
  "Planifié": "bg-warning/20 text-warning",
  "Confirmé": "bg-green-500/20 text-green-400",
  "Non confirmé": "bg-orange-300/20 text-orange-300",
  "À risque": "bg-orange-400/20 text-orange-400",
  "Reporté": "bg-blue-400/20 text-blue-400",
  "Annulé (à rappeler)": "bg-amber-500/20 text-amber-400",
  "Annulé (définitif)": "bg-muted text-muted-foreground",
  "No-show": "bg-red-400/20 text-red-400",
  "Closé": "bg-info/20 text-info",
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatDateKey(d: Date) { return d.toISOString().split("T")[0]; }
function getMonday(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day + (day === 0 ? -6 : 1));
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

interface WeeklyViewProps {
  currentDate: Date;
  apptsByDate: Record<string, Appointment[]>;
  onSelectAppt: (appt: Appointment) => void;
}

const WeeklyView = ({ currentDate, apptsByDate, onSelectAppt }: WeeklyViewProps) => {
  const todayKey = formatDateKey(new Date());
  const monday = getMonday(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="glass-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((d, i) => {
          const key = formatDateKey(d);
          const isToday = key === todayKey;
          return (
            <div key={i} className={`px-2 py-2 text-center border-r border-border/50 last:border-r-0 ${isToday ? "bg-primary/10" : ""}`}>
              <div className="text-[11px] text-muted-foreground">{WEEKDAYS[i]}</div>
              <div className={`text-sm font-medium ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 min-h-[420px]">
        {days.map((d, i) => {
          const key = formatDateKey(d);
          const dayAppts = (apptsByDate[key] || []).sort((a, b) => a.time.localeCompare(b.time));
          const isToday = key === todayKey;
          return (
            <div key={i} className={`p-1 border-r border-border/50 last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}>
              {dayAppts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onSelectAppt(a)}
                  className={`w-full text-left border-l-4 rounded-md px-2 py-1.5 mb-1 transition-colors hover:brightness-110 ${STATUS_COLORS[a.status] || "border-l-muted bg-secondary/50"}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground truncate">{a.fullName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${STATUS_BADGE[a.status] || "bg-secondary text-secondary-foreground"}`}>
                      {a.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{a.time}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyView;
