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
      <div className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Event roster</h2>
        </header>
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Select an event to see its registered players.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Event roster</h2>
            {eventName && <p className="text-xs text-slate-500">{eventName}</p>}
          </div>
          <span className="text-xs text-slate-500">Loading…</span>
        </header>
        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          Fetching players registered for this event.
        </div>
      </div>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : "Failed to load event players";
    return (
      <div className="space-y-3">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Event roster</h2>
            {eventName && <p className="text-xs text-slate-500">{eventName}</p>}
          </div>
        </header>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Event roster</h2>
          {eventName && <p className="text-xs text-slate-500">Players registered for {eventName}</p>}
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          {roster.length} player{roster.length === 1 ? "" : "s"}
        </span>
      </header>

      {localError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {localError}
        </div>
      )}

      {roster.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          No players registered for this event yet. Use the forms below to add players from the list or
          register new ones.
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
          {roster.map((registration) => (
            <li
              key={registration.id}
              className="flex flex-wrap items-center justify-between gap-3 bg-white/80 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{registration.player.full_name}</p>
                {registration.player.phone_number && (
                  <p className="text-xs text-slate-500">{registration.player.phone_number}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(registration.id)}
                disabled={removeRegistration.isPending && busyId === registration.id}
                className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
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
