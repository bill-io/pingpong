import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Player } from "@/types";

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