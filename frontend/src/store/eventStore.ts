import { create } from "zustand";
import type { EventEntity } from "@/types";

type EventState = {
  activeEvent?: EventEntity;
  setActiveEvent: (event?: EventEntity) => void;
};

export const useEventStore = create<EventState>((set) => ({
  activeEvent: undefined,
  setActiveEvent: (event) => set({ activeEvent: event })
}));