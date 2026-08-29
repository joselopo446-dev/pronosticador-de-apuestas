import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

const LEAGUES = [
  { id: 262, slug: "liga-mx", country: "Mexico" },
  { id: 140, slug: "la-liga", country: "Spain" },
];

const SEASON = 2025;

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
  };
  league: {
    id: number;
    name: string;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

async function fetchFromApi(endpoint: string, params: Record<string, string> = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_FOOTBALL_BASE_URL!;
  const apiKey = process.env.RAPIDAPI_KEY!;
  const qs = new URLSearchParams({ league: "", season: "", ...params }).toString();
  const url = `${baseUrl}${endpoint}?${qs}`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      "x-rapidapi-key": apiKey,
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function syncFixtures(supabase: SupabaseAny, leagueId: number, leagueSlug: string) {
  const data = await fetchFromApi("/fixtures", {
    league: String(leagueId),
    season: String(SEASON),
  });
  const fixtures: ApiFixture[] = data.response;

  let inserted = 0;
  let updated = 0;

  for (const f of fixtures) {
    const homeTeam = f.teams.home;
    const awayTeam = f.teams.away;

    await supabase.from("teams").upsert(
      { id: homeTeam.id, name: homeTeam.name, logo_url: homeTeam.logo },
      { onConflict: "id" }
    );

    await supabase.from("teams").upsert(
      { id: awayTeam.id, name: awayTeam.name, logo_url: awayTeam.logo },
      { onConflict: "id" }
    );

    const matchDate = new Date(f.fixture.date).toISOString().split("T")[0];

    const { data: comp } = await supabase
      .from("competitions")
      .select("id")
      .eq("slug", leagueSlug)
      .single();

    if (!comp) continue;

    const { data: homeDb } = await supabase
      .from("teams")
      .select("id")
      .eq("name", homeTeam.name)
      .single();

    const { data: awayDb } = await supabase
      .from("teams")
      .select("id")
      .eq("name", awayTeam.name)
      .single();

    if (!homeDb || !awayDb) continue;

    const status = f.fixture.status.short;
    const isFinished = status === "FT";
    const isLive = ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(status);

    const matchData = {
      api_football_id: f.fixture.id,
      competition_id: comp.id,
      home_team_id: homeDb.id,
      away_team_id: awayDb.id,
      match_date: matchDate,
      round: f.league.round || null,
      status: isFinished ? "finished" : isLive ? "live" : "scheduled",
      home_score: isFinished || isLive ? f.goals.home : null,
      away_score: isFinished || isLive ? f.goals.away : null,
    };

    const { error } = await supabase
      .from("matches")
      .upsert(matchData, { onConflict: "api_football_id" });

    if (error) {
      console.error(`Error upserting match ${f.fixture.id}:`, error.message);
    } else {
      if (isFinished) updated++;
      else inserted++;
    }
  }

  return { inserted, updated, total: fixtures.length };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = [];

  for (const league of LEAGUES) {
    try {
      const result = await syncFixtures(supabase, league.id, league.slug);
      results.push({ league: league.slug, ...result });
    } catch (error) {
      results.push({
        league: league.slug,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ synced: true, results, timestamp: new Date().toISOString() });
}
