// =============================================
// SERVICIO DE CACHÉ PARA APIs DE FÚTBOL
// =============================================
// Optimiza llamadas a APIs guardando todo en Supabase

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================
// LÍMITES DE APIs
// =============================================
const API_LIMITS = {
  "api-football": { daily: 100, perMinute: 0 }, // RapidAPI: 100/día
  "football-data.org": { daily: 600, perMinute: 10 }, // v4: 10/min
  "thesportsdb": { daily: 1000, perMinute: 60 }, // Gratis: ilimitado pero cuidamos
};

// =============================================
// VERIFICAR LÍMITES
// =============================================
export async function canUseAPI(apiName: string): Promise<boolean> {
  const limit = API_LIMITS[apiName as keyof typeof API_LIMITS];
  if (!limit) return false;

  const { data } = await supabase.rpc("check_api_limit", {
    p_api_name: apiName,
    p_daily_limit: limit.daily,
  });

  return data === true;
}

export async function logAPIUsage(apiName: string, endpoint: string, count = 1) {
  await supabase.rpc("log_api_usage", {
    p_api_name: apiName,
    p_endpoint: endpoint,
    p_count: count,
  });
}

export async function getAPIUsageToday(apiName: string) {
  const { data } = await supabase
    .from("api_usage_log")
    .select("request_count")
    .eq("api_name", apiName)
    .eq("date", new Date().toISOString().split("T")[0]);

  return data?.reduce((sum, r) => sum + (r.request_count || 0), 0) || 0;
}

// =============================================
// SINCRONIZACIÓN DE FIXTURES
// =============================================
export async function syncFixtures(
  league: string,
  leagueCode: string,
  fixtures: any[],
  jornada?: string
) {
  const results = { inserted: 0, updated: 0, errors: 0 };

  for (const fixture of fixtures) {
    try {
      const { error } = await supabase.from("football_fixtures").upsert(
        {
          fixture_id: fixture.id?.toString() || `${fixture.homeTeam}-${fixture.awayTeam}-${fixture.date}`,
          league,
          league_code: leagueCode,
          jornada: jornada || fixture.jornada || fixture.round || "",
          season: fixture.season || "2025",
          home_team: fixture.homeTeam || fixture.home_team,
          away_team: fixture.awayTeam || fixture.away_team,
          home_team_id: fixture.homeTeamId || fixture.home_team_id,
          away_team_id: fixture.awayTeamId || fixture.away_team_id,
          match_date: fixture.date || fixture.match_date,
          match_time: fixture.time || fixture.match_time,
          venue: fixture.venue || "",
          status: fixture.status || "scheduled",
          home_goals: fixture.homeGoals || fixture.home_goals,
          away_goals: fixture.awayGoals || fixture.away_goals,
          home_score_ht: fixture.homeScoreHt || fixture.home_score_ht,
          away_score_ht: fixture.awayScoreHt || fixture.away_score_ht,
          referee: fixture.referee || "",
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "fixture_id" }
      );

      if (error) {
        console.error(`Error syncing fixture: ${error.message}`);
        results.errors++;
      } else {
        results.inserted++;
      }
    } catch (e) {
      results.errors++;
    }
  }

  return results;
}

// =============================================
// SINCRONIZACIÓN DE EQUIPOS
// =============================================
export async function syncTeams(league: string, teams: any[]) {
  const results = { inserted: 0, updated: 0, errors: 0 };

  for (const team of teams) {
    try {
      const { error } = await supabase.from("football_teams").upsert(
        {
          team_id: team.id || team.team_id,
          team_name: team.name || team.team_name,
          league,
          country: team.country || "",
          founded: team.founded,
          venue_name: team.venue_name || team.venue,
          venue_capacity: team.venue_capacity,
          logo_url: team.logo || team.logo_url,
          current_position: team.position || team.current_position,
          points: team.points || 0,
          played: team.played || team.games_played || 0,
          wins: team.wins || 0,
          draws: team.draws || 0,
          losses: team.losses || 0,
          goals_for: team.goalsFor || team.goals_for || 0,
          goals_against: team.goalsAgainst || team.goals_against || 0,
          home_wins: team.homeWins || team.home_wins || 0,
          home_draws: team.homeDraws || team.home_draws || 0,
          home_losses: team.homeLosses || team.home_losses || 0,
          away_wins: team.awayWins || team.away_wins || 0,
          away_draws: team.awayDraws || team.away_draws || 0,
          away_losses: team.awayLosses || team.away_losses || 0,
          form: team.form || "",
          last_5_results: team.last5 || team.last_5_results || [],
          elo_rating: team.elo || team.elo_rating || 1500,
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "team_id" }
      );

      if (error) {
        console.error(`Error syncing team: ${error.message}`);
        results.errors++;
      } else {
        results.inserted++;
      }
    } catch (e) {
      results.errors++;
    }
  }

  return results;
}

// =============================================
// SINCRONIZACIÓN DE HISTORIAL
// =============================================
export async function syncMatchHistory(matches: any[]) {
  const results = { inserted: 0, updated: 0, errors: 0 };

  for (const match of matches) {
    try {
      const { error } = await supabase.from("football_match_history").upsert(
        {
          fixture_id: match.fixture_id || `${match.homeTeam}-${match.awayTeam}-${match.date}`,
          league: match.league || "liga-mx",
          season: match.season || "2025",
          match_date: match.date || match.match_date,
          home_team: match.homeTeam || match.home_team,
          away_team: match.awayTeam || match.away_team,
          home_goals: match.homeGoals || match.home_goals,
          away_goals: match.awayGoals || match.away_goals,
          home_score_ht: match.homeScoreHt || match.home_score_ht,
          away_score_ht: match.awayScoreHt || match.away_score_ht,
          home_shots: match.homeShots || match.home_shots,
          away_shots: match.awayShots || match.away_shots,
          home_shots_on_target: match.homeShotsOnTarget || match.home_shots_on_target,
          away_shots_on_target: match.awayShotsOnTarget || match.away_shots_on_target,
          home_corners: match.homeCorners || match.home_corners,
          away_corners: match.awayCorners || match.away_corners,
          home_fouls: match.homeFouls || match.home_fouls,
          away_fouls: match.awayFouls || match.away_fouls,
          home_yellow_cards: match.homeYellowCards || match.home_yellow_cards,
          away_yellow_cards: match.awayYellowCards || match.away_yellow_cards,
          home_red_cards: match.homeRedCards || match.home_red_cards,
          away_red_cards: match.awayRedCards || match.away_red_cards,
          referee: match.referee || "",
          venue: match.venue || "",
        },
        { onConflict: "fixture_id" }
      );

      if (error) {
        console.error(`Error syncing match: ${error.message}`);
        results.errors++;
      } else {
        results.inserted++;
      }
    } catch (e) {
      results.errors++;
    }
  }

  return results;
}

// =============================================
// OBTENER DATOS DEL CACHÉ
// =============================================
export async function getCachedFixtures(league: string, jornada?: string) {
  let query = supabase
    .from("football_fixtures")
    .select("*")
    .eq("league", league)
    .order("match_date", { ascending: true });

  if (jornada) {
    query = query.eq("jornada", jornada);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCachedTeams(league: string) {
  const { data, error } = await supabase
    .from("football_teams")
    .select("*")
    .eq("league", league)
    .order("current_position", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCachedTeamByName(teamName: string) {
  const { data, error } = await supabase
    .from("football_teams")
    .select("*")
    .ilike("team_name", `%${teamName}%`)
    .single();

  if (error) return null;
  return data;
}

export async function getCachedMatchHistory(
  league: string,
  teamName?: string,
  limit = 50
) {
  let query = supabase
    .from("football_match_history")
    .select("*")
    .eq("league", league)
    .order("match_date", { ascending: false })
    .limit(limit);

  if (teamName) {
    query = query.or(`home_team.ilike.%${teamName}%,away_team.ilike.%${teamName}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCachedH2H(homeTeam: string, awayTeam: string, limit = 10) {
  const { data, error } = await supabase
    .from("football_match_history")
    .select("*")
    .or(
      `and(home_team.ilike.%${homeTeam}%,away_team.ilike.%${awayTeam}%),and(home_team.ilike.%${awayTeam}%,away_team.ilike.%${homeTeam}%)`
    )
    .order("match_date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// =============================================
// ESTADO DE SINCRONIZACIÓN
// =============================================
export async function getSyncStatus(syncType: string) {
  const { data, error } = await supabase
    .from("sync_status")
    .select("*")
    .eq("sync_type", syncType)
    .single();

  if (error) return null;
  return data;
}

export async function updateSyncStatus(
  syncType: string,
  status: string,
  recordsSynced = 0,
  errorMessage?: string
) {
  const { error } = await supabase.from("sync_status").upsert(
    {
      sync_type: syncType,
      status,
      last_sync: new Date().toISOString(),
      next_sync: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // +4 horas
      records_synced: recordsSynced,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sync_type" }
  );

  if (error) throw error;
}

// =============================================
// VERIFICAR SI NECESITA SINCRONIZACIÓN
// =============================================
export async function needsSync(syncType: string, hoursThreshold = 4): Promise<boolean> {
  const status = await getSyncStatus(syncType);
  
  if (!status || !status.last_sync) return true;
  
  const lastSync = new Date(status.last_sync);
  const now = new Date();
  const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceSync >= hoursThreshold;
}
