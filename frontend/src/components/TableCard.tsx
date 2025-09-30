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
    <div className="rounded-2xl border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isFree ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isFree ? "Free" : "Occupied"}
        </span>
      </div>

      <div className="text-sm space-y-1">
        <div className="opacity-70">Players:</div>
        {players.length ? (
          <ul className="list-disc list-inside">
            {players.map((p) => (
              <li key={p.id}>{p.full_name}</li>
            ))}
          </ul>
        ) : (
          <div className="opacity-60">—</div>
        )}
      </div>

      {errorMessage && <div className="text-xs text-red-600">{errorMessage}</div>}

      <div className="mt-auto flex gap-2">
        <button
          disabled={!canAssign || busy}
          onClick={onAssign}
          className={`px-3 py-1.5 rounded-xl border text-sm ${
            canAssign && !busy ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
          }`}
          title={assignTooltip}
        >
          Assign
        </button>
        <button
          disabled={!canFree || busy}
          onClick={onFree}
          className={`px-3 py-1.5 rounded-xl border text-sm ${
            canFree && !busy ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
          }`}
          title={freeTooltip}
        >
          Free
        </button>
      </div>
    </div>
  );
}
