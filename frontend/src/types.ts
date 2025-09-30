export type Player = {
  id: number | string;
  full_name: string;
  phone_number?: string | null;
  is_playing?: boolean;
};

export type PlayerSlim = {
  id: number | string;
  full_name: string;
  phone_number?: string | null;
};

export type EventEntity = {
  id: number | string;
  name: string;
  tables_count: number;
  starts_at?: string | null;
  location?: string | null;
};

export type TableEntity = {
  id: number | string;
  event_id?: number | string;
  status: string;
  position?: number | null;
  label?: string | null;
  current_assignment_id?: number | null;
  player1?: PlayerSlim | null;
  player2?: PlayerSlim | null;
};