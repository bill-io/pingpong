import { useEffect, useMemo } from "react";
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

  useEffect(() => {
    if (!activeEvent && events?.length) {
      setActiveEvent(events[0]);
    }
  }, [events, activeEvent, setActiveEvent]);

  useEffect(() => {
    clear();
  }, [activeEvent?.id, clear]);

  const { data: tables, isLoading: tablesLoading, error: tablesError } = useTables(activeEvent?.id);
  const registrationsQuery = useRegistrations(activeEvent?.id);

  const eventOptions = useMemo(() => events ?? [], [events]);
  const selectedEventId = activeEvent?.id?.toString() ?? "";
  const noEvents = !eventsLoading && !eventsError && eventOptions.length === 0;

  const totalPlayers = playersQuery.data?.length ?? 0;
  const totalTables = tables?.length ?? 0;
  const occupiedTables = tables?.filter((table) => (table.status ?? "").toLowerCase() !== "free").length ?? 0;
  const freeTables = Math.max(totalTables - occupiedTables, 0);
  const rosterCount = registrationsQuery.data?.length ?? 0;

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
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:px-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Dashboard</span>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">PingPong Event Hub</h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Coordinate tournaments, register players, and control tables from a single modern interface.
            </p>
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                  Active event
                </label>
                {activeEvent ? (
                  <div className="mt-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100">
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
                  className="w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:border-sky-300 focus:outline-none"
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

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur transition hover:border-sky-300/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
              <p className="mt-2 text-xs text-slate-300">{stat.description}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow-xl">
              <EventCollection
                events={eventOptions}
                isLoading={eventsLoading}
                error={eventsError}
                selectedId={activeEvent?.id}
                onSelect={(event) => setActiveEvent(event)}
              />
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-xl">
              <PlayerList />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow-xl">
              <EventPlayers
                eventId={activeEvent?.id}
                eventName={activeEvent?.name}
                registrations={registrationsQuery.data}
                isLoading={registrationsQuery.isLoading}
                error={registrationsQuery.error}
              />
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-xl">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Tables</h2>
                  <p className="text-sm text-slate-500">Monitor occupancy and start matches.</p>
                </div>
                {activeEvent && (
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {tablesLoading ? "Updating…" : `${occupiedTables} occupied • ${freeTables} free`}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-4">
                {noEvents ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    Create an event to manage tables.
                  </div>
                ) : !activeEvent ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    Select an event to see its tables.
                  </div>
                ) : tablesLoading ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    Loading tables…
                  </div>
                ) : tablesError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Failed to load tables
                  </div>
                ) : tables && tables.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {tables.map((table) => (
                      <TableCard key={table.id} table={table} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    No tables configured for this event yet. Use the tools below to add or generate tables.
                  </div>
                )}
              </div>
            </div>

            <AdminActions tables={tables} />
          </div>
        </div>
      </div>
    </div>
  );
}