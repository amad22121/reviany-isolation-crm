import { Appointment } from "@/data/crm-data";

const STATUS_COLORS: Record<string, string> = {
  "Confirmé": "border-l-green-500 bg-green-500/10",
  "En attente": "border-l-warning bg-warning/10",
  "À risque": "border-l-orange-400 bg-orange-400/10",
  "Closed": "border-l-info bg-info/10",
  "Annulé": "border-l-muted-foreground bg-muted/30",
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatDateKey(d: Date) { return d.toISOString().split("T")[0]; }

interface MonthlyViewProps {
  currentDate: Date;
  apptsByDate: Record<string, Appointment[]>;
  onSelectAppt: (appt: Appointment) => void;
}

const MonthlyView = ({ currentDate, apptsByDate, onSelectAppt }: MonthlyViewProps) => {
  const todayKey = formatDateKey(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const totalCells = startOffset + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < rows * 7; i++) {
    const dayNum = i - startOffset + 1;
    cells.push(dayNum < 1 || dayNum > lastDay.getDate() ? null : new Date(year, month, dayNum));
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="px-2 py-2 text-center text-[11px] text-muted-foreground border-r border-border/50 last:border-r-0">
            {wd}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="p-1 border-r border-b border-border/50 min-h-[80px] bg-secondary/20" />;
          const key = formatDateKey(d);
          const dayAppts = (apptsByDate[key] || []).sort((a, b) => a.time.localeCompare(b.time));
          const isToday = key === todayKey;
          return (
            <div key={i} className={`p-1 border-r border-b border-border/50 min-h-[80px] ${isToday ? "bg-primary/5" : ""}`}>
              <div className={`text-xs mb-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{d.getDate()}</div>
              {dayAppts.slice(0, 3).map((a) => (
                <button
                  key={a.id}
                  onClick={() => onSelectAppt(a)}
                  className={`w-full text-left border-l-2 rounded px-1 py-0.5 mb-0.5 text-[10px] truncate ${STATUS_COLORS[a.status] || "border-l-muted bg-secondary/50"}`}
                >
                  <span className="font-medium text-foreground">{a.time}</span>{" "}
                  <span className="text-muted-foreground">{a.fullName}</span>
                </button>
              ))}
              {dayAppts.length > 3 && (
                <div className="text-[10px] text-muted-foreground pl-1">+{dayAppts.length - 3} autres</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyView;
