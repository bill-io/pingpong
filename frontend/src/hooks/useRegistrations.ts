import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Registration } from "@/types";

export function useRegistrations(eventId?: string | number) {
  return useQuery({
    queryKey: ["registrations", eventId],
    queryFn: () => {
      if (!eventId) throw new Error("No active event selected");
      return api.get<Registration[]>(`/events/${eventId}/registrations`);
    },
    enabled: Boolean(eventId),
    staleTime: 10_000
  });
}

export function useRegisterPlayer(eventId?: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { playerId: number | string }) => {
      if (!eventId) throw new Error("No active event selected");
      return api.post<Registration>(`/events/${eventId}/registrations`, {
        player_id: Number(payload.playerId)
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registrations", eventId] });
      qc.invalidateQueries({ queryKey: ["players"] });
    }
  });
}

export function useRemoveRegistration(eventId?: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { registrationId: number | string; eventId?: number | string }) => {
      const targetEventId = payload.eventId ?? eventId;
      if (!targetEventId) throw new Error("No active event selected");
      return api.delete<void>(
        `/events/${targetEventId}/registrations/${payload.registrationId}`
      );
    },
    onSuccess: (_data, vars) => {
      const targetEventId = vars.eventId ?? eventId;
      if (targetEventId) {
        qc.invalidateQueries({ queryKey: ["registrations", targetEventId] });
      }
    }
  });
}