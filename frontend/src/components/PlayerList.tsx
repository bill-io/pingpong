import { usePlayers } from "@/hooks/usePlayers";
import { useSelection } from "@/store/selectionStore";
import type { Player } from "@/types";

export default function PlayerList() {
  const { data, isLoading, error } = usePlayers();
  const { selected, toggle } = useSelection();

  if (isLoading) return <div className="p-3 text-sm opacity-70">Loading players…</div>;
  if (error) return <div className="p-3 text-sm text-red-600">Failed to load players</div>;

  const isSelected = (p: Player) => selected.some((s) => s.id === p.id);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Players</h2>
        <span className="text-xs opacity-70">{selected.length}/2 selected</span>
      </div>
      <div className="rounded-xl border">
        <ul className="divide-y">
          {data?.map((p) => (
            <li
              key={p.id}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                isSelected(p) ? "bg-gray-100" : ""
              }`}
              onClick={() => toggle(p)}
            >
              <span className="truncate">{p.full_name}</span>
              {isSelected(p) && <span className="text-xs rounded-full px-2 py-0.5 border">Selected</span>}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs opacity-70">Tip: select up to two players, then pick a table.</p>
    </div>
  );
}
