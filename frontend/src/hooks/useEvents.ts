import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { EventEntity } from "@/types";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => api.get<EventEntity[]>("/events"),
    staleTime: 30_000
  });
}