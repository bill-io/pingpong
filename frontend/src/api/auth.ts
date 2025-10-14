import { api } from "./client";
import type { AgentLoginResponse } from "@/types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AgentLoginResponse>("/auth/login", { email, password })
};
