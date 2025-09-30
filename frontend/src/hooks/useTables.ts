import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Player, TableEntity } from "@/types";

export function useTables(eventId?: string | number) {
  return useQuery({
    queryKey: ["tables", eventId],
    queryFn: () => {
      if (!eventId) throw new Error("No active event selected");
      return api.get<TableEntity[]>(`/events/${eventId}/tables/board`);
    },
    enabled: Boolean(eventId),
    refetchInterval: 5000
  });
}

export function useAssignPlayers(eventId?: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { tableId: TableEntity["id"]; players: [Player["id"], Player["id"]]; notify?: boolean }) => {
      if (!eventId) throw new Error("No active event selected");
      const [p1, p2] = vars.players;
      return api.post<TableEntity>(`/events/${eventId}/tables/${vars.tableId}/assign`, {
        player1_id: p1,
        player2_id: p2,
        notify: vars.notify ?? true
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables", eventId] });
      qc.invalidateQueries({ queryKey: ["players"] });
    }
  });
}

export function useFreeTable(eventId?: string | number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { tableId: TableEntity["id"] }) => {
      if (!eventId) throw new Error("No active event selected");
      return api.post<TableEntity>(`/events/${eventId}/tables/${vars.tableId}/free`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables", eventId] });
      qc.invalidateQueries({ queryKey: ["players"] });
    }
  });
}
