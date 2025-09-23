export type Player = {
  id: number | string;
  full_name: string;
  phone_number?: string | null;
  is_playing?: boolean;
};

export type TableEntity = {
  id: number | string;
  name: string;
  is_free: boolean;
  players: Player[];
};
