import { create } from "zustand";
import type { Player } from "@/types";

type State = {
  selected: Player[];
  toggle: (p: Player) => void;
  clear: () => void;
};

export const useSelection = create<State>((set, get) => ({
  selected: [],
  toggle: (p) => {
    const cur = get().selected;
    const exists = cur.some((x) => x.id === p.id);
    if (exists) return set({ selected: cur.filter((x) => x.id !== p.id) });
    if (cur.length >= 2) return; // max 2 players
    set({ selected: [...cur, p] });
  },
  clear: () => set({ selected: [] })
}));
