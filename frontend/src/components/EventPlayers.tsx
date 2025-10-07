import { useState } from "react";
import { useRemoveRegistration } from "@/hooks/useRegistrations";
import { useSelection } from "@/store/selectionStore";
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
  const { selected, toggle } = useSelection();

  const roster = [...(registrations ?? [])].sort((a, b) =>
    a.player.full_name.localeCompare(b.player.full_name)
  );

  const busyId = removeRegistration.variables?.registrationId;
  const isSelected = (playerId: Registration["player"]["id"]) =>
    selected.some((item) => item.id.toString() === playerId.toString());

  const handleRemove = async (registration: Registration) => {
    if (!eventId) return;
    setLocalError(null);
    try {
      await removeRegistration.mutateAsync({ registrationId: registration.id });
      if (isSelected(registration.player.id)) {
        toggle(registration.player);
      }
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

      <p className="text-xs text-slate-400">
        Click a player to queue them for table assignment, or remove them from the event if needed.
      </p>

      {localError && (
        <div className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{localError}</div>
      )}

      {roster.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
          No players registered for this event yet. Visit the dashboard to enroll players into this roster.
        </div>
      ) : (
        <ul className="space-y-3">
          {roster.map((registration) => {
            const player = registration.player;
            const playerId = player.id;
            const selectedState = isSelected(playerId);
            return (
              <li key={registration.id}>
                <div
                  className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    selectedState
                      ? "border-sky-400/60 bg-sky-500/15 text-sky-100 shadow-[0_0_25px_rgba(56,189,248,0.2)]"
                      : "border-slate-800/70 bg-slate-950/70"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(player)}
                    className="flex flex-1 flex-col items-start gap-1 text-left text-sm"
                    title={selectedState ? "Selected for table assignment" : "Click to select for table assignment"}
                  >
                    <span className="font-medium text-white">{player.full_name}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                      Player #{player.id}
                    </span>
                    {player.phone_number && <span className="text-xs text-slate-400">{player.phone_number}</span>}
                  </button>
                  <div className="flex items-center gap-2">
                    {selectedState && (
                      <span className="rounded-full border border-sky-400/60 bg-sky-500/25 px-2 py-0.5 text-xs font-semibold text-sky-100">
                        Selected
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(registration)}
                      disabled={removeRegistration.isPending && busyId === registration.id}
                      className="rounded-lg border border-rose-300/40 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-100 transition hover:border-rose-200/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removeRegistration.isPending && busyId === registration.id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
