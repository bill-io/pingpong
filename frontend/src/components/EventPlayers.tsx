import { useState } from "react";
import { useRemoveRegistration } from "@/hooks/useRegistrations";
import type { Registration } from "@/types";

interface Props {
  eventId?: number | string;
  eventName?: string;
  registrations?: Registration[];
  isLoading: boolean;
  error: unknown;
}

export default function EventPlayers({ eventId, eventName, registrations, isLoading, error }: Props) {
  const removeRegistration = useRemoveRegistration(eventId);
  const [localError, setLocalError] = useState<string | null>(null);

  const roster = [...(registrations ?? [])].sort((a, b) =>
    a.player.full_name.localeCompare(b.player.full_name)
  );

  const busyId = removeRegistration.variables?.registrationId;

  const handleRemove = async (registrationId: Registration["id"]) => {
    if (!eventId) return;
    setLocalError(null);
    try {
      await removeRegistration.mutateAsync({ registrationId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove player";
      setLocalError(message);
    }
  };

  if (!eventId) {
    return (
      <div className="space-y-3 text-slate-200">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Event roster</h2>
        </header>
        <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
          Select an event to see its registered players.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 text-slate-200">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Event roster</h2>
            {eventName && <p className="text-xs text-slate-400">{eventName}</p>}
          </div>
          <span className="text-xs text-slate-400">Loading…</span>
        </header>
        <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/50 p-4 text-sm text-slate-400">
          Fetching players registered for this event.
        </div>
      </div>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : "Failed to load event players";
    return (
      <div className="space-y-3 text-slate-200">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Event roster</h2>
            {eventName && <p className="text-xs text-slate-400">{eventName}</p>}
          </div>
        </header>
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">{message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-slate-200">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Event roster</h2>
          {eventName && <p className="text-xs text-slate-400">Players registered for {eventName}</p>}
        </div>
        <span className="rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">
          {roster.length} player{roster.length === 1 ? "" : "s"}
        </span>
      </header>

      {localError && (
        <div className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{localError}</div>
      )}

      {roster.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
          No players registered for this event yet. Use the forms below to add players from the list or register new ones.
        </div>
      ) : (
        <ul className="divide-y divide-slate-800/70 overflow-hidden rounded-2xl border border-slate-800/70">
          {roster.map((registration) => (
            <li
              key={registration.id}
              className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{registration.player.full_name}</p>
                {registration.player.phone_number && (
                  <p className="text-xs text-slate-400">{registration.player.phone_number}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(registration.id)}
                disabled={removeRegistration.isPending && busyId === registration.id}
                className="rounded-lg border border-rose-300/40 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-100 transition hover:border-rose-200/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removeRegistration.isPending && busyId === registration.id ? "Removing…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
