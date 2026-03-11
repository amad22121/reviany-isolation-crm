import { useMemo, useState, useCallback } from "react";
import { useAuth } from "@/store/crm-store";
import { Appointment, AppointmentStatus, APPOINTMENT_STATUSES, APPOINTMENT_STATUS_LABELS } from "@/data/crm-data";
import { useAppointments, useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import FicheClient from "@/components/FicheClient";
import CalendarFilters from "@/components/calendar/CalendarFilters";
import CalendarStats from "@/components/calendar/CalendarStats";
import DailyView from "@/components/calendar/DailyView";
import WeeklyView from "@/components/calendar/WeeklyView";
import MonthlyView from "@/components/calendar/MonthlyView";

type ViewType = "day" | "week" | "month";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatDateKey(d: Date) { return d.toISOString().split("T")[0]; }
function getMonday(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day + (day === 0 ? -6 : 1));
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

const CalendarPage = () => {
  const { data: allAppointments = [] } = useAppointments();
  const updateStatusMutation = useUpdateAppointmentStatus();
  const { role, currentRepId, currentManagerId } = useAuth();
  const isRep = role === "representant";

  const [view, setView] = useState<ViewType>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRepId, setSelectedRepId] = useState<string>(isRep ? (currentRepId || "") : "all");
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([...APPOINTMENT_STATUSES]);
  const [ficheAppt, setFicheAppt] = useState<Appointment | null>(null);
  const { data: teamMembers = [] } = useTeamMembers();

  const today = new Date();
  const todayKey = formatDateKey(today);

  const handleStatusToggle = useCallback((status: AppointmentStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }, []);

  // All visible appointments (role-filtered, no status/rep filter yet for stats)
  // Also apply "À risque" auto-detection: Non confirmé + within 12h → À risque (UI mock)
  const roleFilteredAppointments = useMemo(() => {
    let appts = allAppointments.filter((a) => !a.isBacklog);
    if (isRep) appts = appts.filter((a) => a.repId === currentRepId);
    else if (role === "gestionnaire" && teamMembers.length > 0) {
      const repIds = new Set(teamMembers.filter((r) => r.role === "representant").map((r) => r.id));
      appts = appts.filter((a) => repIds.has(a.repId));
    }
    // Auto-detect À risque: Non confirmé + appointment within 12 hours
    const now = Date.now();
    return appts.map((a) => {
      if (a.status === AppointmentStatus.UNCONFIRMED) {
        const apptTime = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
        const hoursUntil = (apptTime - now) / (1000 * 60 * 60);
        if (hoursUntil <= 12 && hoursUntil > -2) {
          return { ...a, status: AppointmentStatus.AT_RISK };
        }
      }
      return a;
    });
  }, [allAppointments, role, currentRepId, currentManagerId, isRep]);

  // Fully filtered appointments (rep + status)
  const filteredAppointments = useMemo(() => {
    return roleFilteredAppointments
      .filter((a) => selectedStatuses.includes(a.status))
      .filter((a) => {
        if (isRep) return true;
        if (selectedRepId === "all") return true;
        return a.repId === selectedRepId;
      });
  }, [roleFilteredAppointments, selectedStatuses, selectedRepId, isRep]);

  // Stats for today
  const stats = useMemo(() => {
    const todayAppts = roleFilteredAppointments.filter((a) => a.date === todayKey);
    const confirmed = todayAppts.filter((a) => a.status === AppointmentStatus.CONFIRMED).length;
    const atRisk = todayAppts.filter((a) => a.status === AppointmentStatus.AT_RISK || a.status === AppointmentStatus.CANCELLED_CALLBACK).length;

    const weekStart = getMonday(today);
    const weekStartKey = formatDateKey(weekStart);
    const weekEndKey = formatDateKey(addDays(weekStart, 6));
    const weekAppts = roleFilteredAppointments.filter((a) => a.date >= weekStartKey && a.date <= weekEndKey);
    const weekClosed = weekAppts.filter((a) => a.status === AppointmentStatus.CLOSED || a.status === AppointmentStatus.CONFIRMED).length;
    const closingRate = weekAppts.length > 0 ? Math.round((weekClosed / weekAppts.length) * 100) : 0;

    return { total: todayAppts.length, confirmed, atRisk, closingRate };
  }, [roleFilteredAppointments, todayKey]);

  // Appointments by date for week/month views
  const apptsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    filteredAppointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [filteredAppointments]);

  // Daily view appointments
  const dailyAppts = useMemo(() => {
    const dateKey = formatDateKey(currentDate);
    return filteredAppointments
      .filter((a) => a.date === dateKey)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredAppointments, currentDate]);

  const navigate = useCallback((dir: number) => {
    setCurrentDate((d) => {
      const next = new Date(d);
      if (view === "day") next.setDate(next.getDate() + dir);
      else if (view === "week") next.setDate(next.getDate() + dir * 7);
      else next.setMonth(next.getMonth() + dir);
      return next;
    });
  }, [view]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);
  const goTomorrow = useCallback(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    setCurrentDate(t);
    setView("day");
  }, []);

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

  // Only confirmed appointments for route
  const confirmedDailyAppts = useMemo(() => {
    return dailyAppts.filter((a) => a.status === AppointmentStatus.CONFIRMED);
  }, [dailyAppts]);

  const canGenerateRoute = useMemo(() => {
    if (isRep) return confirmedDailyAppts.length >= 2;
    if (selectedRepId === "all") return false; // must select a rep
    return confirmedDailyAppts.length >= 2;
  }, [isRep, selectedRepId, confirmedDailyAppts]);

  const routeButtonLabel = useMemo(() => {
    if (!isRep && selectedRepId === "all") return "Sélectionne un rep pour l'itinéraire";
    if (confirmedDailyAppts.length < 2) return "Pas assez de RDV confirmés";
    return "Itinéraire Google Maps";
  }, [isRep, selectedRepId, confirmedDailyAppts]);

  const generateRoute = useCallback(() => {
    if (!canGenerateRoute) return;
    const stops = confirmedDailyAppts.map((a) => `${a.address}, ${a.city}`);
    const origin = encodeURIComponent(stops[0]);
    const destination = encodeURIComponent(stops[stops.length - 1]);
    const waypoints = stops.slice(1, -1).map(encodeURIComponent).join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}`;
    window.open(url, "_blank");
  }, [canGenerateRoute, confirmedDailyAppts]);

  const handleUpdateStatus = useCallback((id: string, status: AppointmentStatus) => {
    const appt = allAppointments.find((a) => a.id === id);
    updateStatusMutation.mutate({
      id,
      status,
      userId: role || "system",
      currentStatusLog: appt?.statusLog || [],
      previousStatus: appt?.status || "",
    });
  }, [updateStatusMutation, role, allAppointments]);

  const dateLabel = today.toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <div className="space-y-4">
        <CalendarStats
          total={stats.total}
          confirmed={stats.confirmed}
          atRisk={stats.atRisk}
          closingRate={stats.closingRate}
          dateLabel={dateLabel}
        />

        <CalendarFilters
          isRep={isRep}
          selectedRepId={selectedRepId}
          onRepChange={setSelectedRepId}
          selectedStatuses={selectedStatuses}
          onStatusToggle={handleStatusToggle}
          view={view}
          onViewChange={setView}
          headerLabel={headerLabel}
          onNavigate={navigate}
          onToday={goToday}
          onTomorrow={goTomorrow}
          showRouteButton={view === "day"}
          routeButtonDisabled={!canGenerateRoute}
          routeButtonLabel={routeButtonLabel}
          onGenerateRoute={generateRoute}
        />

        {view === "day" && (
          <DailyView
            appointments={dailyAppts}
            role={role!}
            currentRepId={currentRepId}
            onOpenFiche={(appt) => setFicheAppt(appt)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
        {view === "week" && (
          <WeeklyView
            currentDate={currentDate}
            apptsByDate={apptsByDate}
            onSelectAppt={setFicheAppt}
          />
        )}
        {view === "month" && (
          <MonthlyView
            currentDate={currentDate}
            apptsByDate={apptsByDate}
            onSelectAppt={setFicheAppt}
          />
        )}
      </div>

      <FicheClient
        appointment={ficheAppt}
        open={!!ficheAppt}
        onOpenChange={(o) => !o && setFicheAppt(null)}
      />
    </>
  );
};

export default CalendarPage;
