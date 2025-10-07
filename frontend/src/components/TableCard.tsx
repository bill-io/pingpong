import { useState } from "react";
import { useAssignPlayers, useFreeTable } from "@/hooks/useTables";
import { useEventStore } from "@/store/eventStore";
import { useSelection } from "@/store/selectionStore";
import type { TableEntity } from "@/types";

export default function TableCard({ table }: { table: TableEntity }) {
  const eventId = useEventStore((s) => s.activeEvent?.id);
  const { selected, clear } = useSelection();
  const assign = useAssignPlayers(eventId);
  const free = useFreeTable(eventId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const busy = assign.isPending || free.isPending;
  const players = [table.player1, table.player2].filter(
    (p): p is NonNullable<TableEntity["player1"]> => Boolean(p)
  );
  const status = (table.status ?? "").toString().toLowerCase();
  const isFree = status === "free";
  const canAssign = selected.length === 2 && isFree && Boolean(eventId);
  const canFree = !isFree && Boolean(eventId);

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

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Table</p>
          <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isFree ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {isFree ? "Free" : "Occupied"}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current match</p>
        {players.length ? (
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <ul className="space-y-1 text-slate-700">
              {players.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-400" aria-hidden />
                  <span className="truncate">{p.full_name}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
            No players assigned.
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          disabled={!canAssign || busy}
          onClick={onAssign}
          className={`flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition ${
            canAssign && !busy ? "hover:bg-white" : "cursor-not-allowed opacity-50"
          }`}
          title={assignTooltip}
        >
          Assign selected players
        </button>
        <button
          disabled={!canFree || busy}
          onClick={onFree}
          className={`flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition ${
            canFree && !busy ? "hover:bg-white" : "cursor-not-allowed opacity-50"
          }`}
          title={freeTooltip}
        >
          Free table
        </button>
      </div>
    </div>
  );
}