export interface Auth {
  email: string;
  password: string;
}
export interface User {
  id: string;
  email: string;
  created_polls_count?: number;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  settings?: {
    allowMultiple: boolean;
    showResults: boolean;
    allowVoteChange?: boolean;
  };
  created_by: string;
  created_at: string;
  ends_at?: string | null;
  email?: string | null;
}

export interface Vote {
  id: string;
  poll_id: string;
  user_id?: string | null;
  ip_hash?: string | null;
  selected_options: string[];
  created_at: string;
}
