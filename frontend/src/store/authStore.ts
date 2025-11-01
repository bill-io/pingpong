import { create } from "zustand";
import type { Agent, AgentLoginResponse } from "@/types";

type AuthState = {
  agent?: Agent;
  token?: string;
  login: (payload: AgentLoginResponse) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  agent: undefined,
  token: undefined,
  login: ({ agent, token }) => set({ agent, token }),
  logout: () => set({ agent: undefined, token: undefined })
}));
