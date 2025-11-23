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
  assignment_status?: string | null;
  assignment_created_at?: string | null;
  started_at?: string | null;
  notified_at?: string | null;
  ended_at?: string | null;
  player1?: PlayerSlim | null;
  player2?: PlayerSlim | null;
};

export type Registration = {
  id: number | string;
  event_id: number | string;
  player_id: number | string;
  created_at?: string;
  player: Player;
};

export type Agent = {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
};

export type AgentLoginResponse = {
  agent: Agent;
  token: string;
};

export type BulkImportResult = {
  total_rows: number;
  created: number;
  skipped: number;
  errors: string[];
};