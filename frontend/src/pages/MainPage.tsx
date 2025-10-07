import { useEffect, useMemo, useState } from "react";
import PlayerList from "@/components/PlayerList";
import TableCard from "@/components/TableCard";
import AdminActions from "@/components/AdminActions";
import EventCollection from "@/components/EventCollection";
import EventPlayers from "@/components/EventPlayers";
import { useEvents } from "@/hooks/useEvents";
import { useTables } from "@/hooks/useTables";
import { usePlayers } from "@/hooks/usePlayers";
import { useRegistrations } from "@/hooks/useRegistrations";
import { useEventStore } from "@/store/eventStore";
import { useSelection } from "@/store/selectionStore";

export default function MainPage() {
  const { data: events, isLoading: eventsLoading, error: eventsError } = useEvents();
  const { activeEvent, setActiveEvent } = useEventStore();
  const { clear } = useSelection();
  const playersQuery = usePlayers();
  const [activeView, setActiveView] = useState<"dashboard" | "event">("dashboard");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activeEvent && events?.length) {
      setActiveEvent(events[0]);
    }
  }, [events, activeEvent, setActiveEvent]);

  useEffect(() => {
    clear();
  }, [activeEvent?.id, clear]);

  useEffect(() => {
    if (!activeEvent) {
      setActiveView("dashboard");
    }
  }, [activeEvent]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { data: tables, isLoading: tablesLoading, error: tablesError } = useTables(activeEvent?.id);
  const registrationsQuery = useRegistrations(activeEvent?.id);

  const eventOptions = useMemo(() => events ?? [], [events]);
  const selectedEventId = activeEvent?.id?.toString() ?? "";
  const totalPlayers = playersQuery.data?.length ?? 0;
  const totalTables = tables?.length ?? 0;
  const occupiedTables = tables?.filter((table) => (table.status ?? "").toLowerCase() !== "free").length ?? 0;
  const freeTables = Math.max(totalTables - occupiedTables, 0);
  const rosterCount = registrationsQuery.data?.length ?? 0;
  const activeTimers = useMemo(
    () =>
      (tables ?? []).filter(
        (table) => table.assignment_status === "active" && Boolean(table.started_at)
      ),
    [tables]
  );
  const longestTimerMs = activeTimers.reduce((max, table) => {
    if (!table.started_at) return max;
    const started = Date.parse(table.started_at);
    if (Number.isNaN(started)) return max;
    return Math.max(max, now - started);
  }, 0);
  const longestTimerFormatted =
    longestTimerMs > 0 ? formatDuration(longestTimerMs) : "00:00";
  const currentTime = new Date(now).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const stats = [
    {
      label: "Players in database",
      value: playersQuery.isLoading ? "…" : totalPlayers.toString(),
      description: "Total unique players registered."
    },
    {
      label: activeEvent ? `${activeEvent.name} roster` : "Event roster",
      value: activeEvent
        ? registrationsQuery.isLoading
          ? "…"
          : rosterCount.toString()
        : "—",
      description: activeEvent
        ? "Players enrolled in the active event."
        : "Select an event to see who is registered."
    },
    {
      label: "Tables ready",
      value: activeEvent
        ? tablesLoading
          ? "…"
          : `${freeTables}/${totalTables}`
        : "—",
      description: activeEvent
        ? occupiedTables === 0
          ? "All tables are free right now."
          : `${occupiedTables} table${occupiedTables === 1 ? "" : "s"} currently occupied.`
        : "Create or select an event to manage tables."
    },
    {
      label: "Active timers",
      value: activeEvent
        ? `${activeTimers.length}`
        : "—",
      description: activeEvent
        ? activeTimers.length
          ? `Longest match running ${longestTimerFormatted}.`
          : "No active match timers at the moment."
        : "Select an event to monitor timers."
    }
  ];

  const renderTables = (emptyMessage: string) => {
    if (tablesLoading) {
      return (
        <div className="rounded-xl border border-dashed border-slate-700/60 p-6 text-center text-sm text-slate-400">
          Loading tables…
        </div>
      );
    }

    if (tablesError) {
      return (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          Failed to load tables
        </div>
      );
    }

    if (!tables?.length) {
      return (
        <div className="rounded-xl border border-dashed border-slate-700/60 p-6 text-center text-sm text-slate-400">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => (
          <TableCard key={table.id} table={table} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:px-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Control center</span>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">PingPong Event Hub</h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Coordinate tournaments, register players, and control tables from a single modern interface.
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Local time • {currentTime}</p>
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-sky-400/20 bg-slate-900/70 p-5 shadow-[0_20px_60px_-35px_rgba(56,189,248,0.75)] backdrop-blur">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-200">Active event</label>
                {activeEvent ? (
                  <div className="mt-2 rounded-2xl border border-sky-400/30 bg-slate-900/60 px-3 py-2 text-sm text-slate-100">
                    <p className="font-medium text-white">{activeEvent.name}</p>
                    <p className="text-xs text-slate-300">
                      {[activeEvent.location, `${activeEvent.tables_count} tables`].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-300">No event selected.</p>
                )}
              </div>

              {eventsLoading ? (
                <span className="text-sm text-slate-300">Loading events…</span>
              ) : eventsError ? (
                <span className="text-sm text-rose-200">Failed to load events</span>
              ) : eventOptions.length ? (
                <select
                  className="w-full rounded-xl border border-sky-400/30 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-sky-300 focus:outline-none"
                  value={selectedEventId}
                  onChange={(e) => {
                    const next = eventOptions.find((ev) => ev.id.toString() === e.target.value);
                    setActiveEvent(next);
                  }}
                >
                  {eventOptions.map((ev) => (
                    <option key={ev.id} value={ev.id.toString()}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-slate-300">Create an event to get started.</span>
              )}
            </div>
          </div>
        </header>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sky-400/20 bg-slate-900/60 p-3 text-sm text-slate-200">
          <div className="inline-flex overflow-hidden rounded-2xl border border-sky-400/30 bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => setActiveView("dashboard")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeView === "dashboard"
                  ? "bg-sky-500/20 text-white shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              disabled={!activeEvent}
              onClick={() => setActiveView("event")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeView === "event"
                  ? "bg-sky-500/20 text-white shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                  : "text-slate-300 hover:text-white"
              } ${!activeEvent ? "opacity-40" : ""}`}
            >
              Event detail
            </button>
          </div>

          <p className="text-xs text-slate-400">
            {activeView === "dashboard"
              ? "View global stats, manage the roster, and prepare events."
              : `Deep dive into ${activeEvent?.name ?? "your selected event"}.`}
          </p>
        </section>

        {activeView === "dashboard" ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-sky-400/20 bg-slate-900/60 p-5 backdrop-blur transition hover:border-sky-300/40"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-2 text-xs text-slate-300">{stat.description}</p>
                </div>
              ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-sky-400/20 bg-slate-950/70 p-6 shadow-[0_25px_70px_-40px_rgba(56,189,248,0.65)]">
                  <EventCollection
                    events={eventOptions}
                    isLoading={eventsLoading}
                    error={eventsError}
                    selectedId={activeEvent?.id}
                    onSelect={(event) => setActiveEvent(event)}
                  />
                </div>

                <div className="rounded-3xl border border-sky-400/20 bg-slate-950/70 p-6 shadow-[0_25px_70px_-40px_rgba(56,189,248,0.65)]">
                  <PlayerList />
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-sky-400/20 bg-slate-950/70 p-6 shadow-[0_25px_70px_-40px_rgba(56,189,248,0.65)]">
                  <EventPlayers
                    eventId={activeEvent?.id}
                    eventName={activeEvent?.name}
                    registrations={registrationsQuery.data}
                    isLoading={registrationsQuery.isLoading}
                    error={registrationsQuery.error}
                  />
                </div>
                <div className="rounded-3xl border border-sky-400/20 bg-slate-950/70 p-6 shadow-[0_25px_70px_-40px_rgba(56,189,248,0.65)]">
                  <AdminActions tables={tables} registrations={registrationsQuery.data} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <section className="rounded-3xl border border-sky-400/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 shadow-[0_35px_90px_-45px_rgba(56,189,248,0.7)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">{activeEvent?.location || "Event"}</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{activeEvent?.name}</h2>
                  <p className="mt-3 max-w-xl text-sm text-slate-300">
                    Manage registrations, assign tables, and keep your matches running smoothly.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <span className="rounded-full border border-sky-400/40 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-sky-200">
                    {activeEvent?.tables_count ?? 0} table{(activeEvent?.tables_count ?? 0) === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-full border border-sky-400/40 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-sky-200">
                    {registrationsQuery.isLoading ? "…" : `${rosterCount} player${rosterCount === 1 ? "" : "s"}`}
                  </span>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-sky-400/20 bg-slate-950/70 p-6 shadow-[0_25px_70px_-40px_rgba(56,189,248,0.65)]">
                  <EventPlayers
                    eventId={activeEvent?.id}
                    eventName={activeEvent?.name}
                    registrations={registrationsQuery.data}
                    isLoading={registrationsQuery.isLoading}
                    error={registrationsQuery.error}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-sky-400/20 bg-slate-950/70 p-6 shadow-[0_25px_70px_-40px_rgba(56,189,248,0.65)]">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Tables</h3>
                      <p className="text-sm text-slate-400">Assign players or free tables instantly.</p>
                    </div>
                    <div className="rounded-full border border-sky-400/40 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-sky-200">
                      {tablesLoading ? "Updating…" : `${occupiedTables} occupied • ${freeTables} free`}
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    {renderTables(
                      "No tables configured for this event yet. Return to the dashboard to add or seed new tables."
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
