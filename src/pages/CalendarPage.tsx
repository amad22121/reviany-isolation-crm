import { useMemo, useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS, Appointment } from "@/data/crm-data";
import FicheClient from "@/components/FicheClient";
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ViewType = "day" | "week" | "month";

const STATUS_COLORS: Record<string, string> = {
  Confirmé: "border-l-green-500 bg-green-500/10",
  "En attente": "border-l-orange-400 bg-orange-400/10",
  Absence: "border-l-red-500 bg-red-500/10",
  Fermé: "border-l-blue-500 bg-blue-500/10",
  Annulé: "border-l-gray-500 bg-gray-500/10",
};

const STATUS_BADGE: Record<string, string> = {
  Confirmé: "bg-green-500/20 text-green-400",
  "En attente": "bg-orange-400/20 text-orange-400",
  Absence: "bg-red-500/20 text-red-400",
  Fermé: "bg-blue-500/20 text-blue-400",
  Annulé: "bg-gray-500/20 text-gray-400",
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7AM–18PM

function formatDateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

function getMonday(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function extractCity(address: string) {
  const parts = address.split(",");
  return parts.length >= 2 ? parts[parts.length - 2].trim().replace(/\s+QC$/, "") : "";
}

const CalendarPage = () => {
  const { appointments } = useCrm();
  const { role, currentRepId, currentManagerId } = useAuth();

  const [view, setView] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const today = new Date();
  const todayKey = formatDateKey(today);

  // Permission filtering
  const visibleAppointments = useMemo(() => {
    let appts = appointments.filter((a) => a.status !== "Backlog");
    if (role === "representant") return appts.filter((a) => a.repId === currentRepId);
    if (role === "gestionnaire" && currentManagerId) {
      const managerReps = new Set(SALES_REPS.filter((r) => r.managerId === currentManagerId).map((r) => r.id));
      return appts.filter((a) => managerReps.has(a.repId));
    }
    return appts;
  }, [appointments, role, currentRepId, currentManagerId]);

  // Stats
  const stats = useMemo(() => {
    const todayAppts = visibleAppointments.filter((a) => a.date === todayKey);
    const confirmed = todayAppts.filter((a) => a.status === "Confirmé").length;
    const atRisk = todayAppts.filter((a) => a.status === "Absence" || a.status === "Annulé").length;

    const weekStart = getMonday(today);
    const weekEnd = addDays(weekStart, 6);
    const weekKey = formatDateKey(weekEnd);
    const weekStartKey = formatDateKey(weekStart);
    const weekAppts = visibleAppointments.filter((a) => a.date >= weekStartKey && a.date <= weekKey);
    const weekClosed = weekAppts.filter((a) => a.status === "Fermé" || a.status === "Confirmé").length;
    const closingRate = weekAppts.length > 0 ? Math.round((weekClosed / weekAppts.length) * 100) : 0;

    return { total: todayAppts.length, confirmed, atRisk, closingRate };
  }, [visibleAppointments, todayKey]);

  const getRepName = (id: string) => SALES_REPS.find((r) => r.id === id)?.name || id;

  // Navigation
  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  // Header label
  const headerLabel = useMemo(() => {
    if (view === "day") {
      return currentDate.toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    if (view === "week") {
      const mon = getMonday(currentDate);
      const sun = addDays(mon, 6);
      return `${mon.getDate()} ${MONTHS[mon.getMonth()]} — ${sun.getDate()} ${MONTHS[sun.getMonth()]} ${sun.getFullYear()}`;
    }
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [view, currentDate]);

  // Appointments grouped by date
  const apptsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    visibleAppointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [visibleAppointments]);

  // Event card
  const EventCard = ({ appt }: { appt: Appointment }) => (
    <button
      onClick={() => setSelectedAppt(appt)}
      className={`w-full text-left border-l-4 rounded-md px-2 py-1.5 mb-1 transition-colors hover:brightness-110 ${STATUS_COLORS[appt.status] || "border-l-gray-500 bg-secondary/50"}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-medium text-foreground truncate">
          {appt.fullName}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${STATUS_BADGE[appt.status] || "bg-secondary text-secondary-foreground"}`}>
          {appt.status}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[11px] text-muted-foreground">{appt.time}</span>
        <span className="text-[11px] text-muted-foreground">·</span>
        <span className="text-[11px] text-muted-foreground truncate">{appt.city || extractCity(appt.address)}</span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{getRepName(appt.repId)}</div>
    </button>
  );

  // DAILY VIEW
  const renderDayView = () => {
    const dateKey = formatDateKey(currentDate);
    const dayAppts = (apptsByDate[dateKey] || []).sort((a, b) => a.time.localeCompare(b.time));

    return (
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-[60px_1fr] divide-x divide-border">
          {HOURS.map((hour) => {
            const hourStr = String(hour).padStart(2, "0");
            const hourAppts = dayAppts.filter((a) => a.time.startsWith(hourStr));
            return (
              <div key={hour} className="contents">
                <div className="px-2 py-3 text-xs text-muted-foreground text-right border-b border-border/50">
                  {hourStr}:00
                </div>
                <div className="p-1 border-b border-border/50 min-h-[52px]">
                  {hourAppts.map((a) => (
                    <EventCard key={a.id} appt={a} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // WEEKLY VIEW
  const renderWeekView = () => {
    const monday = getMonday(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

    return (
      <div className="glass-card overflow-hidden">
        {/* Header row */}
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
        {/* Body */}
        <div className="grid grid-cols-7 min-h-[420px]">
          {days.map((d, i) => {
            const key = formatDateKey(d);
            const dayAppts = (apptsByDate[key] || []).sort((a, b) => a.time.localeCompare(b.time));
            const isToday = key === todayKey;
            return (
              <div key={i} className={`p-1 border-r border-border/50 last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}>
                {dayAppts.map((a) => (
                  <EventCard key={a.id} appt={a} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // MONTHLY VIEW
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // start from monday
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const totalCells = startOffset + lastDay.getDate();
    const rows = Math.ceil(totalCells / 7);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < rows * 7; i++) {
      const dayNum = i - startOffset + 1;
      if (dayNum < 1 || dayNum > lastDay.getDate()) {
        cells.push(null);
      } else {
        cells.push(new Date(year, month, dayNum));
      }
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
                    onClick={() => setSelectedAppt(a)}
                    className={`w-full text-left border-l-2 rounded px-1 py-0.5 mb-0.5 text-[10px] truncate ${STATUS_COLORS[a.status] || "border-l-gray-500 bg-secondary/50"}`}
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

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-foreground">Calendrier</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "RDV aujourd'hui", value: stats.total, icon: CalendarCheck, color: "text-primary" },
            { label: "Confirmés aujourd'hui", value: stats.confirmed, icon: CheckCircle2, color: "text-green-400" },
            { label: "À risque aujourd'hui", value: stats.atRisk, icon: AlertTriangle, color: "text-destructive" },
            { label: "Taux closing semaine", value: `${stats.closingRate}%`, icon: TrendingUp, color: "text-info" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Navigation & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={goToday} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm transition-colors">
              Aujourd'hui
            </button>
            <button onClick={() => navigate(1)} className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-foreground capitalize ml-2">{headerLabel}</span>
          </div>

          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  view === v ? "bg-primary text-primary-foreground" : "text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar */}
        {view === "day" && renderDayView()}
        {view === "week" && renderWeekView()}
        {view === "month" && renderMonthView()}
      </div>

      <FicheClient
        appointment={selectedAppt}
        open={!!selectedAppt}
        onOpenChange={(o) => !o && setSelectedAppt(null)}
      />
    </>
  );
};

export default CalendarPage;
