import { usePlayers } from "@/hooks/usePlayers";
import { useSelection } from "@/store/selectionStore";
import type { Player } from "@/types";

export default function PlayerList() {
  const { data, isLoading, error } = usePlayers();
  const { selected, toggle } = useSelection();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/50 p-4 text-sm text-slate-400">
        Loading players…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
        Failed to load players
      </div>
    );
  }

  const players = [...(data ?? [])].sort((a, b) => a.full_name.localeCompare(b.full_name));
  const isSelected = (p: Player) => selected.some((s) => s.id === p.id);

  return (
    <div className="space-y-3 text-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Players</h2>
        <span className="text-xs text-slate-400">{selected.length}/2 selected</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/70">
        <ul className="divide-y divide-slate-800/70">
          {players.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:ring-offset-0 ${
                  isSelected(p)
                    ? "bg-sky-500/15 text-sky-100"
                    : "text-slate-200 hover:bg-slate-900/70"
                }`}
                onClick={() => toggle(p)}
              >
                <span className="truncate">{p.full_name}</span>
                <span className="flex items-center gap-2 text-xs">
                  {p.is_playing && (
                    <span className="rounded-full border border-amber-300/50 bg-amber-400/20 px-2 py-0.5 text-amber-100">
                      Playing
                    </span>
                  )}
                  {isSelected(p) && (
                    <span className="rounded-full border border-sky-400/60 bg-sky-500/20 px-2 py-0.5 text-sky-100">
                      Selected
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-slate-400">Tip: select up to two players, then pick a table.</p>
    </div>
  );
}
