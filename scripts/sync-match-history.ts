// =============================================
// SCRIPT: Sincronizar historial de partidos Liga MX
// =============================================
// Ejecutar: npx tsx scripts/sync-match-history.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TSD_API_KEY = "3";
const LEAGUE_ID = "4350"; // Liga MX en TheSportsDB

const LIGA_MX_TEAMS: Record<string, string> = {
  "América": "134193",
  "Cruz Azul": "134196",
  "Guadalajara": "134205",
  "Monterrey": "134198",
  "Tigres UANL": "134197",
  "Pumas UNAM": "134201",
  "León": "134207",
  "Santos Laguna": "134192",
  "Toluca": "134204",
  "Pachuca": "134191",
  "Atlas": "134195",
  "Puebla": "134199",
  "Necaxa": "134194",
  "San Luis": "134202",
  "Mazatlán": "47810",
  "Juárez": "134200",
};

// Mapeo de nombres de TheSportsDB a nombres estándar
const TEAM_NAME_MAP: Record<string, string> = {
  "Club América": "América",
  "América": "América",
  "Cruz Azul": "Cruz Azul",
  "CD Guadalajara": "Guadalajara",
  "Guadalajara": "Guadalajara",
  "Chivas": "Guadalajara",
  "Monterrey": "Monterrey",
  "Rayados": "Monterrey",
  "Tigres UANL": "Tigres UANL",
  "Tigres": "Tigres UANL",
  "Pumas UNAM": "Pumas UNAM",
  "Pumas": "Pumas UNAM",
  "Club León": "León",
  "León": "León",
  "Santos Laguna": "Santos Laguna",
  "Santos": "Santos Laguna",
  "Deportivo Toluca": "Toluca",
  "Toluca": "Toluca",
  "Club Pachuca": "Pachuca",
  "Pachuca": "Pachuca",
  "Atlas": "Atlas",
  "Club Atlas": "Atlas",
  "Club Puebla": "Puebla",
  "Puebla": "Puebla",
  "Necaxa": "Necaxa",
  "Club Necaxa": "Necaxa",
  "San Luis": "San Luis",
  "Atlético San Luis": "San Luis",
  "Mazatlán": "Mazatlán",
  "FC Juárez": "Juárez",
  "Juárez": "Juárez",
};

function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] || name;
}

async function fetchTeamHistory(teamId: string): Promise<any[]> {
  const url = `https://www.thesportsdb.com/api/v1/json/${TSD_API_KEY}/eventslast.php?id=${teamId}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching history for team ${teamId}:`, error);
    return [];
  }
}

async function syncMatchHistory() {
  console.log("🔄 Iniciando sincronización de historial de partidos Liga MX...\n");

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [teamName, teamId] of Object.entries(LIGA_MX_TEAMS)) {
    console.log(`\n📊 Procesando: ${teamName} (ID: ${teamId})`);

    const events = await fetchTeamHistory(teamId);
    console.log(`   Encontrados ${events.length} partidos recientes`);

    // Filtrar solo partidos de Liga MX
    const ligaMxEvents = events.filter(
      (e: any) =>
        e.strLeague === "Liga MX" ||
        e.idLeague === LEAGUE_ID
    );

    console.log(`   Liga MX: ${ligaMxEvents.length} partidos`);

    for (const event of ligaMxEvents) {
      try {
        const homeTeam = normalizeTeamName(event.strHomeTeam);
        const awayTeam = normalizeTeamName(event.strAwayTeam);
        const matchDate = event.dateEvent;
        const homeGoals = parseInt(event.intHomeScore) || 0;
        const awayGoals = parseInt(event.intAwayScore) || 0;
        const jornada = event.strRound || "";
        const season = event.strSeason || "";

        // Solo insertar si tenemos datos válidos
        if (!homeTeam || !awayTeam || !matchDate) {
          totalSkipped++;
          continue;
        }

        const { error } = await supabase.from("match_history").upsert(
          {
            home_team: homeTeam,
            away_team: awayTeam,
            home_goals: homeGoals,
            away_goals: awayGoals,
            match_date: matchDate,
            jornada: jornada,
            season: season,
            tournament: "liga-mx",
            match_type: "liga-mx",
          },
          { onConflict: "home_team,away_team,match_date" }
        );

        if (error) {
          console.error(`   ❌ Error insertando ${homeTeam} vs ${awayTeam}:`, error.message);
          totalErrors++;
        } else {
          totalInserted++;
        }
      } catch (e) {
        totalErrors++;
      }
    }

    // Pequeña pausa para no sobrecargar la API
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log("\n✅ Sincronización completada:");
  console.log(`   - Insertados: ${totalInserted}`);
  console.log(`   - Omitidos: ${totalSkipped}`);
  console.log(`   - Errores: ${totalErrors}`);

  // Verificar total de registros
  const { count } = await supabase
    .from("match_history")
    .select("*", { count: "exact", head: true });

  console.log(`   - Total en BD: ${count}`);
}

syncMatchHistory().catch(console.error);
