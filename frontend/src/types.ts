export type Player = {
  id: number | string;
  full_name: string;
  phone_number?: string | null;
};

export type TableEntity = {
  id: number | string;
  name: string;
  is_free: boolean;
  players: Player[];
};
