import { useAssignPlayers, useFreeTable } from "@/hooks/useTables";
import { useSelection } from "@/store/selectionStore";
import type { TableEntity } from "@/types";

export default function TableCard({ table }: { table: TableEntity }) {
  const { selected, clear } = useSelection();
  const assign = useAssignPlayers();
  const free = useFreeTable();

  const busy = assign.isPending || free.isPending;
  const canAssign = selected.length > 0 && selected.length <= 2;

  const onAssign = async () => {
    try {
      await assign.mutateAsync({ tableId: table.id, playerIds: selected.map((p) => p.id) });
      clear();
    } catch (e) {
      // minimal error handling for MVP
      alert("Failed to assign players");
    }
  };

  const onFree = async () => {
    try {
      await free.mutateAsync({ tableId: table.id });
    } catch {
      alert("Failed to free table");
    }
  };

  return (
    <div className="rounded-2xl border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{table.name}</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            table.is_free ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {table.is_free ? "Free" : "Busy"}
        </span>
      </div>

      <div className="text-sm">
        <div className="opacity-70">Players:</div>
        {table.players?.length ? (
          <ul className="list-disc list-inside">
            {table.players.map((p) => (
              <li key={p.id}>{p.full_name}</li>
            ))}
          </ul>
        ) : (
          <div className="opacity-60">—</div>
        )}
      </div>

      <div className="mt-auto flex gap-2">
        <button
          disabled={!canAssign || busy}
          onClick={onAssign}
          className={`px-3 py-1.5 rounded-xl border text-sm ${
            canAssign && !busy ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
          }`}
          title={canAssign ? "" : "Select up to 2 players first"}
        >
          Assign
        </button>
        <button
          disabled={busy}
          onClick={onFree}
          className={`px-3 py-1.5 rounded-xl border text-sm hover:bg-gray-50`}
        >
          Free
        </button>
      </div>
    </div>
  );
}
