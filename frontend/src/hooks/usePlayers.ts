import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Player } from "@/types";

export function usePlayers() {
  return useQuery({
    queryKey: ["players"],
    queryFn: () => api.get<Player[]>("/players"),
    refetchInterval: 5000
  });
}
