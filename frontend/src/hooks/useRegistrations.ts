import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Registration } from "@/types";

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
    }
  });
}