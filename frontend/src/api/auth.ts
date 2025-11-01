import { api } from "./client";
import type { Agent, AgentLoginResponse } from "@/types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AgentLoginResponse>("/auth/login", { email, password }),
  signup: (payload: { full_name: string; email: string; password: string }) =>
    api.post<Agent>("/agents", payload)
};
