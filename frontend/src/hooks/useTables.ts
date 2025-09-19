import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { TableEntity } from "@/types";

export function useTables() {
  return useQuery({
    queryKey: ["tables"],
    queryFn: () => api.get<TableEntity[]>("/tables"),
    refetchInterval: 5000
  });
}

export function useAssignPlayers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { tableId: TableEntity["id"]; playerIds: (string | number)[] }) =>
      api.post<TableEntity>(`/tables/${vars.tableId}/assign`, { player_ids: vars.playerIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
    }
  });
}

export function useFreeTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { tableId: TableEntity["id"] }) =>
      api.post<TableEntity>(`/tables/${vars.tableId}/free`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
    }
  });
}
