import { useEffect, useMemo, useState } from "react";
import { useAssignPlayers, useFreeTable, useNotifyAssignment, useStartTimer } from "@/hooks/useTables";
import { useEventStore } from "@/store/eventStore";
import { useSelection } from "@/store/selectionStore";
import type { TableEntity } from "@/types";

export default function TableCard({ table }: { table: TableEntity }) {
  const eventId = useEventStore((s) => s.activeEvent?.id);
  const { selected, clear } = useSelection();
  const assign = useAssignPlayers(eventId);
  const free = useFreeTable(eventId);
  const notifyAssignment = useNotifyAssignment(eventId);
  const startTimer = useStartTimer(eventId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shouldNotifyOnAssign, setShouldNotifyOnAssign] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const busy = assign.isPending || free.isPending;
  const players = [table.player1, table.player2].filter(
    (p): p is NonNullable<TableEntity["player1"]> => Boolean(p)
  );
  const status = (table.status ?? "").toString().toLowerCase();
  const isFree = status === "free";
  const canAssign = selected.length === 2 && isFree && Boolean(eventId);
  const canFree = !isFree && Boolean(eventId);
  const assignmentId = table.current_assignment_id ?? undefined;
  const assignmentActive = table.assignment_status === "active";
  const startedAt = useMemo(() => (table.started_at ? new Date(table.started_at) : undefined), [table.started_at]);
  const notifiedAt = useMemo(() => (table.notified_at ? new Date(table.notified_at) : undefined), [table.notified_at]);
  const createdAt = useMemo(
    () => (table.assignment_created_at ? new Date(table.assignment_created_at) : undefined),
    [table.assignment_created_at]
  );

  useEffect(() => {
    if (!startedAt || !assignmentActive) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [assignmentActive, startedAt]);

  useEffect(() => {
    if (!assignmentActive) {
      setNow(Date.now());
    }
  }, [assignmentActive]);

  const elapsedMs = startedAt && assignmentActive ? Math.max(0, now - startedAt.getTime()) : 0;
  const elapsedLabel = formatDuration(elapsedMs);
  const startedLabel = startedAt ? startedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
  const notifiedLabel = notifiedAt
    ? notifiedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Not sent";
  const createdLabel = createdAt
    ? createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  const assignTooltip = !eventId
    ? "Select an event first"
    : selected.length !== 2
    ? "Select exactly two players"
    : !isFree
    ? "Table is already occupied"
    : "";

  const freeTooltip = !eventId
    ? "Select an event first"
    : isFree
    ? "Table is already free"
    : "";

  const label = table.label ?? (table.position != null ? `Table ${table.position}` : `Table ${table.id}`);

  const onAssign = async () => {
    if (!canAssign) return;
    setErrorMessage(null);
    try {
      await assign.mutateAsync({
        tableId: table.id,
        players: [selected[0].id, selected[1].id],
        notify: shouldNotifyOnAssign
      });
      clear();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to assign players";
      setErrorMessage(message);
    }
  };

  const onFree = async () => {
    if (!canFree) return;
    setErrorMessage(null);
    try {
      await free.mutateAsync({ tableId: table.id });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to free table";
      setErrorMessage(message);
    }
  };

  const onNotify = async () => {
    if (!assignmentId || !assignmentActive) return;
    setErrorMessage(null);
    try {
      await notifyAssignment.mutateAsync({ assignmentId });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to notify players";
      setErrorMessage(message);
    }
  };

  const onStartTimer = async () => {
    if (!assignmentId || !assignmentActive || table.started_at) return;
    setErrorMessage(null);
    try {
      await startTimer.mutateAsync({ assignmentId });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to start timer";
      setErrorMessage(message);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4 text-slate-200 shadow-[0_20px_45px_-30px_rgba(56,189,248,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Table</p>
          <h3 className="text-lg font-semibold text-white">{label}</h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            isFree
              ? "border-emerald-300/50 bg-emerald-400/20 text-emerald-100"
              : "border-rose-300/50 bg-rose-400/20 text-rose-100"
          }`}
        >
          {isFree ? "Free" : "Occupied"}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current match</p>
        {players.length ? (
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/70 px-3 py-2">
            <ul className="space-y-1 text-slate-200">
              {players.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-sky-400" aria-hidden />
                  <span className="truncate">{p.full_name}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700/60 px-3 py-4 text-center text-xs text-slate-400">
            No players assigned.
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {errorMessage}
        </div>
      )}

      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold uppercase tracking-wide text-slate-400">Timer</span>
          <span className="text-lg font-semibold text-white">{elapsedLabel}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400 sm:text-xs">
          <div>
            <span className="block text-slate-500">Assigned</span>
            <span className="text-slate-200">{createdLabel}</span>
          </div>
          <div>
            <span className="block text-slate-500">Notified</span>
            <span className="text-slate-200">{notifiedLabel}</span>
          </div>
          <div>
            <span className="block text-slate-500">Started</span>
            <span className="text-slate-200">{startedLabel}</span>
          </div>
          <div>
            <span className="block text-slate-500">Status</span>
            <span className="text-slate-200">{assignmentActive ? "Running" : "Idle"}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          disabled={!canAssign || busy}
          onClick={onAssign}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            canAssign && !busy
              ? "border-sky-400/60 bg-sky-500/20 text-white hover:border-sky-300"
              : "cursor-not-allowed border-slate-800/60 bg-slate-900/60 text-slate-500"
          }`}
          title={assignTooltip}
        >
          Assign selected players
        </button>
        <button
          disabled={!canFree || busy}
          onClick={onFree}
          className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            canFree && !busy
              ? "border-slate-200/40 bg-slate-800/70 text-slate-100 hover:border-slate-100/60"
              : "cursor-not-allowed border-slate-800/60 bg-slate-900/60 text-slate-500"
          }`}
          title={freeTooltip}
        >
          Free table
        </button>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <input
          id={`notify-${table.id}`}
          type="checkbox"
          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-400 focus:ring-sky-400"
          checked={shouldNotifyOnAssign}
          onChange={(e) => setShouldNotifyOnAssign(e.target.checked)}
        />
        <label htmlFor={`notify-${table.id}`}>Notify players via SMS when assigning</label>
      </div>

      {assignmentActive && (
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!assignmentId || notifyAssignment.isPending}
            onClick={onNotify}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              assignmentId && !notifyAssignment.isPending
                ? "border-sky-400/60 bg-sky-500/10 text-white hover:border-sky-300"
                : "cursor-not-allowed border-slate-800/60 bg-slate-900/60 text-slate-500"
            }`}
          >
            Send SMS reminder
          </button>
          <button
            disabled={!assignmentId || startTimer.isPending || Boolean(table.started_at)}
            onClick={onStartTimer}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              assignmentId && !startTimer.isPending && !table.started_at
                ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300"
                : "cursor-not-allowed border-slate-800/60 bg-slate-900/60 text-slate-500"
            }`}
          >
            {table.started_at ? "Timer running" : "Start timer"}
          </button>
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
