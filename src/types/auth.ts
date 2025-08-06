export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: 'commerciale' | 'manager' | 'owner';
  approved: boolean;
  created_at: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  ruolo: 'commerciale' | 'manager';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}