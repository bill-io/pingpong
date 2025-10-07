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
      <div className="space-y-3 text-slate-200">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Events</h2>
          <span className="text-xs text-slate-400">Loading…</span>
        </header>
        <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/50 p-4 text-sm text-slate-400">
          Fetching events from the server.
        </div>
      </div>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : "Failed to load events";
    return (
      <div className="space-y-3 text-slate-200">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Events</h2>
        </header>
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">{message}</div>
      </div>
    );
  }

  const items = events ?? [];

  return (
    <div className="space-y-4 text-slate-200">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Events</h2>
          <p className="text-xs text-slate-400">Select an event to manage its tables and roster.</p>
        </div>
        <span className="text-xs font-medium text-slate-400">{items.length} total</span>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
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
                  className={`group w-full rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:ring-offset-0 ${
                    isActive
                      ? "border-sky-400/50 bg-sky-500/20 text-white shadow-[0_20px_45px_-25px_rgba(56,189,248,0.7)]"
                      : "border-slate-800/70 bg-slate-950/70 text-slate-100 hover:border-sky-400/40 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">{event.name}</h3>
                      {meta && (
                        <p className={`text-xs ${isActive ? "text-sky-100/90" : "text-slate-400"}`}>{meta}</p>
                      )}
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        isActive
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-sky-400/30 bg-sky-500/10 text-sky-200 group-hover:border-sky-400/50"
                      }`}
                    >
                      {isActive ? "Active" : "Activate"}
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
