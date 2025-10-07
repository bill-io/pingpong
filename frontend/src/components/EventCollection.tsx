import type { EventEntity } from "@/types";

function formatLocation(event: EventEntity) {
  const pieces = [] as string[];
  if (event.location) {
    pieces.push(event.location);
  }
  if (event.tables_count != null) {
    pieces.push(`${event.tables_count} table${event.tables_count === 1 ? "" : "s"}`);
  }
  return pieces.join(" • ");
}

type Props = {
  events?: EventEntity[];
  isLoading: boolean;
  error: unknown;
  selectedId?: EventEntity["id"];
  onSelect: (event: EventEntity) => void;
};

export default function EventCollection({ events, isLoading, error, selectedId, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Events</h2>
          <span className="text-xs text-slate-500">Loading…</span>
        </header>
        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          Fetching events from the server.
        </div>
      </div>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : "Failed to load events";
    return (
      <div className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Events</h2>
        </header>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      </div>
    );
  }

  const items = events ?? [];

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Events</h2>
          <p className="text-xs text-slate-500">Select an event to manage its tables and roster.</p>
        </div>
        <span className="text-xs font-medium text-slate-500">{items.length} total</span>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          No events yet. Use the form on the right to create your first event.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((event) => {
            const isActive = event.id === selectedId;
            const meta = formatLocation(event);
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelect(event)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                      : "border-slate-200 bg-slate-50 text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">{event.name}</h3>
                      {meta && <p className={`text-xs ${isActive ? "text-slate-200" : "text-slate-500"}`}>{meta}</p>}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isActive ? "bg-white/20 text-white" : "bg-white text-slate-700"
                      }`}
                    >
                      Activate
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
