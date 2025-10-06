import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { EventEntity } from "@/types";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => api.get<EventEntity[]>("/events"),
    staleTime: 30_000
  });
}

type EventPayload = {
  name: string;
  tables_count: number;
  starts_at?: string | null;
  location?: string | null;
};

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EventPayload) => api.post<EventEntity>("/events", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    }
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number | string) => api.delete<void>(`/events/${eventId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    }
  });
}