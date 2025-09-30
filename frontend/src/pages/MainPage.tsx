import { useEffect, useMemo } from "react";
import PlayerList from "@/components/PlayerList";
import { useEvents } from "@/hooks/useEvents";
import { useTables } from "@/hooks/useTables";
import TableCard from "@/components/TableCard";
import { useEventStore } from "@/store/eventStore";
import { useSelection } from "@/store/selectionStore";

export default function MainPage() {
  const { data: events, isLoading: eventsLoading, error: eventsError } = useEvents();
  const { activeEvent, setActiveEvent } = useEventStore();
  const { clear } = useSelection();

  useEffect(() => {
    if (!activeEvent && events?.length) {
      setActiveEvent(events[0]);
    }
  }, [events, activeEvent, setActiveEvent]);

  useEffect(() => {
    clear();
  }, [activeEvent?.id, clear]);

  const { data: tables, isLoading: tablesLoading, error: tablesError } = useTables(activeEvent?.id);

  const eventOptions = useMemo(() => events ?? [], [events]);
  const selectedEventId = activeEvent?.id?.toString() ?? "";
  const noEvents = !eventsLoading && !eventsError && eventOptions.length === 0;

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">PingPong Control</h1>
          {activeEvent && (
            <p className="text-sm opacity-70">
              {activeEvent.location ? `${activeEvent.location} • ` : ""}
              {activeEvent.tables_count} tables configured
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1 md:items-end">
          <label className="text-xs uppercase tracking-wide opacity-70">Active event</label>
          {eventsLoading ? (
            <span className="text-sm opacity-70">Loading events…</span>
          ) : eventsError ? (
            <span className="text-sm text-red-600">Failed to load events</span>
          ) : eventOptions.length ? (
            <select
              className="rounded-lg border px-3 py-1.5 text-sm bg-white"
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
            <span className="text-sm opacity-70">No events yet</span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <aside className="md:col-span-1">
          <PlayerList />
        </aside>

        <main className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tables</h2>
          </div>

          {noEvents ? (
            <div className="p-3 text-sm opacity-70">Create an event to manage tables.</div>
          ) : !activeEvent ? (
            <div className="p-3 text-sm opacity-70">Select an event to see its tables.</div>
          ) : tablesLoading ? (
            <div className="p-3 text-sm opacity-70">Loading tables…</div>
          ) : tablesError ? (
            <div className="p-3 text-sm text-red-600">Failed to load tables</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tables?.map((t) => (
                <TableCard key={t.id} table={t} />
              ))}
              {!tables?.length && (
                <div className="p-3 text-sm opacity-70">No tables configured for this event.</div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}