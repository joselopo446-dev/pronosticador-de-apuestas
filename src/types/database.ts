// =============================================
// TIPOS DE SUPABASE (Tipos de Base de Datos)
// =============================================
// Estos tipos se generan automáticamente desde el schema de PostgreSQL.
// Por ahora son placeholders que serán reemplazados con los tipos reales
// cuando ejecutemos: npx supabase gen types typescript
//
// ¿Por qué tipos de base de datos?
// - Dan type safety en todas las consultas a Supabase.
// - Si una columna no existe, TypeScript nos avisa en tiempo de compilación.
// - Evita errores runtime por columnas incorrectas.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Schema de la base de datos.
 * Estos nombres corresponden a las tablas que crearemos en Supabase.
 */
export interface Database {
  public: {
    Tables: {
      sports: {
        Row: {
          id: string;
          name: string;
          slug: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          active?: boolean;
          created_at?: string;
        };
      };
      leagues: {
        Row: {
          id: string;
          sport_id: string;
          country_id: string;
          name: string;
          slug: string;
          api_league_id: number;
          logo_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sport_id: string;
          country_id: string;
          name: string;
          slug: string;
          api_league_id: number;
          logo_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sport_id?: string;
          country_id?: string;
          name?: string;
          slug?: string;
          api_league_id?: number;
          logo_url?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          short_name: string | null;
          logo_url: string | null;
          venue: string | null;
          api_team_id: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          short_name?: string | null;
          logo_url?: string | null;
          venue?: string | null;
          api_team_id: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          short_name?: string | null;
          logo_url?: string | null;
          venue?: string | null;
          api_team_id?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          season_id: string;
          league_id: string;
          home_team_id: string;
          away_team_id: string;
          match_date: string;
          match_time: string | null;
          home_score: number | null;
          away_score: number | null;
          halftime_home: number | null;
          halftime_away: number | null;
          status: string;
          venue: string | null;
          referee: string | null;
          api_match_id: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          league_id: string;
          home_team_id: string;
          away_team_id: string;
          match_date: string;
          match_time?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          halftime_home?: number | null;
          halftime_away?: number | null;
          status?: string;
          venue?: string | null;
          referee?: string | null;
          api_match_id: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          league_id?: string;
          home_team_id?: string;
          away_team_id?: string;
          match_date?: string;
          match_time?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          halftime_home?: number | null;
          halftime_away?: number | null;
          status?: string;
          venue?: string | null;
          referee?: string | null;
          api_match_id?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      predictions: {
        Row: {
          id: string;
          match_id: string;
          model_version_id: string;
          prob_home_win: number | null;
          prob_draw: number | null;
          prob_away_win: number | null;
          expected_home_goals: number | null;
          expected_away_goals: number | null;
          most_likely_score: string | null;
          explanation: Json | null;
          confidence_level: string | null;
          prediction_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          model_version_id: string;
          prob_home_win?: number | null;
          prob_draw?: number | null;
          prob_away_win?: number | null;
          expected_home_goals?: number | null;
          expected_away_goals?: number | null;
          most_likely_score?: string | null;
          explanation?: Json | null;
          confidence_level?: string | null;
          prediction_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          model_version_id?: string;
          prob_home_win?: number | null;
          prob_draw?: number | null;
          prob_away_win?: number | null;
          expected_home_goals?: number | null;
          expected_away_goals?: number | null;
          most_likely_score?: string | null;
          explanation?: Json | null;
          confidence_level?: string | null;
          prediction_date?: string;
          created_at?: string;
        };
      };
      lotteries: {
        Row: {
          id: string;
          name: string;
          slug: string;
          country: string;
          main_numbers_count: number;
          main_numbers_min: number;
          main_numbers_max: number;
          bonus_numbers_count: number;
          bonus_numbers_min: number | null;
          bonus_numbers_max: number | null;
          draw_days: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          country?: string;
          main_numbers_count: number;
          main_numbers_min: number;
          main_numbers_max: number;
          bonus_numbers_count?: number;
          bonus_numbers_min?: number | null;
          bonus_numbers_max?: number | null;
          draw_days?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          country?: string;
          main_numbers_count?: number;
          main_numbers_min?: number;
          main_numbers_max?: number;
          bonus_numbers_count?: number;
          bonus_numbers_min?: number | null;
          bonus_numbers_max?: number | null;
          draw_days?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
      lottery_draws: {
        Row: {
          id: string;
          lottery_id: string;
          draw_number: string | null;
          draw_date: string;
          main_numbers: number[];
          bonus_number: number | null;
          jackpot_amount: number | null;
          source: string | null;
          imported_at: string;
        };
        Insert: {
          id?: string;
          lottery_id: string;
          draw_number?: string | null;
          draw_date: string;
          main_numbers: number[];
          bonus_number?: number | null;
          jackpot_amount?: number | null;
          source?: string | null;
          imported_at?: string;
        };
        Update: {
          id?: string;
          lottery_id?: string;
          draw_number?: string | null;
          draw_date?: string;
          main_numbers?: number[];
          bonus_number?: number | null;
          jackpot_amount?: number | null;
          source?: string | null;
          imported_at?: string;
        };
      };
    };
  };
}
