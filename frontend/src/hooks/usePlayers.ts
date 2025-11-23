import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { BulkImportResult, Player } from "@/types";

function normalizePlayer(p: any): Player {
  const state = (p.state ?? p.status ?? "").toString().toLowerCase();
  return {
    id: p.id ?? p.player_id ?? p.pk,
    full_name: p.full_name ?? p.name ?? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
    phone_number: p.phone_number ?? p.phone ?? null,
    // prefer explicit backend flag; else infer from textual state; else leave undefined (we'll derive)
    is_playing:
      typeof p.is_playing === "boolean"
        ? p.is_playing
        : state
        ? state === "playing"
        : undefined
  };
}

export function usePlayers() {
  return useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const res = await api.get<unknown[]>("/players");
      return res.map((p) => normalizePlayer(p)) as Player[];
    },
    refetchInterval: 5000
  });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { full_name: string; phone_number?: string | null }) =>
      api.post<Player>("/players", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
    }
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: Player["id"]) => api.delete<void>(`/players/id/${playerId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
    }
  });
}

export function useImportPlayers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file }: { file: File }): Promise<BulkImportResult> => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload<BulkImportResult>("/players/import", formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
    }
  });
}