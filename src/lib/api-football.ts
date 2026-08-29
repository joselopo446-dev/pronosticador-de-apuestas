// =============================================
// ADAPTADOR API-FOOTBALL (vía RapidAPI)
// =============================================
// Este archivo encapsula toda la comunicación con API-Football.
// Funciona como una capa de abstracción: si cambiamos de proveedor,
// solo necesitamos modificar este archivo.
//
// API-Football se accede vía RapidAPI, por lo que necesitamos:
// - X-RapidAPI-Key: nuestra clave de autenticación
// - X-RapidAPI-Host: el host del servicio
//
// Rate Limiting del tier gratuito: 100 requests/día.
// Por eso usamos caching agresivo (next: { revalidate }).

import { env } from "./env";

const API_KEY = env.RAPIDAPI_KEY;
const BASE_URL = env.API_FOOTBALL_BASE_URL;

// =============================================
// FUNCIÓN GENÉRICA DE REQUEST
// =============================================
// Esta es la función base que todas las demás usan.
// Centraliza: autenticación, manejo de errores, y caching.

/**
 * Realiza una petición a la API de API-Football.
 *
 * @param endpoint - El endpoint de la API (ej: "/leagues", "/fixtures")
 * @param params - Parámetros de query opcionales
 * @param revalidate - Segundos de caché (default: 1 hora)
 * @returns La respuesta de la API (array de objetos)
 *
 * Ejemplo de uso:
 *   const leagues = await fetchApi("/leagues", { country: "Mexico" }, 86400);
 */
async function fetchApi<T>(
  endpoint: string,
  params?: Record<string, string | number>,
  revalidate: number = 3600
): Promise<T> {
  // Construimos la URL con los parámetros de query
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  // Realizamos la petición con las headers de autenticación
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
    },
    // next.revalidate: cachea la respuesta por X segundos.
    // Después de ese tiempo, se revalida en background (ISR).
    // 3600 = 1 hora, 86400 = 1 día.
    next: { revalidate },
  });

  // Si la respuesta no es exitosa, lanzamos un error descriptivo
  if (!response.ok) {
    console.error(`API-Football Error: ${response.status} - ${response.statusText}`);
    return [] as unknown as T;
  }

  // La API devuelve { response: [...], results: N, paging: {...} }
  // Nosotros solo necesitamos el array de resultados.
  const data = await response.json();
  return data.response as T;
}

// =============================================
// FUNCIONES ESPECÍFICAS POR ENDPOINT
// =============================================

/**
 * Obtiene todas las ligas disponibles, opcionalmente filtradas por país.
 *
 * @param country - Nombre del país en inglés (ej: "Mexico", "Spain")
 * @returns Array de ligas con su información básica
 *
 * Ejemplo:
 *   const ligas = await getLeagues("Mexico");
 *   // [{ id: 262, name: "Liga MX", country: "Mexico", ... }]
 */
export async function getLeagues(country?: string) {
  return fetchApi<ApiLeague[]>(
    "/leagues",
    country ? { country } : undefined,
    86400 // Cache por 24 horas (las ligas no cambian frecuentemente)
  );
}

/**
 * Obtiene los equipos de una liga en una temporada específica.
 *
 * @param leagueId - ID de la liga en API-Football (ej: 262 para Liga MX)
 * @param season - Año de inicio de la temporada (ej: 2024 para 2024/2025)
 * @returns Array de equipos con su información
 */
export async function getTeams(leagueId: number, season: number) {
  return fetchApi<ApiTeam[]>(
    "/teams",
    { league: leagueId, season },
    86400
  );
}

/**
 * Obtiene los fixtures (partidos) de una liga en una temporada.
 *
 * @param leagueId - ID de la liga
 * @param season - Año de la temporada
 * @param round - Jornada específica (opcional, default: "Current")
 * @returns Array de fixtures con resultados y programación
 */
export async function getFixtures(
  leagueId: number,
  season: number,
  round?: string
) {
  return fetchApi<ApiFixture[]>(
    "/fixtures",
    { league: leagueId, season, ...(round ? { round } : {}) },
    1800 // Cache por 30 minutos (los resultados cambian durante el día)
  );
}

/**
 * Obtiene un fixture específico por su ID.
 *
 * @param fixtureId - ID del fixture en API-Football
 * @returns Información detallada del partido
 */
export async function getFixtureById(fixtureId: number) {
  return fetchApi<ApiFixture[]>("/fixtures", { id: fixtureId }, 3600);
}

/**
 * Obtiene las estadísticas de un partido.
 *
 * @param fixtureId - ID del fixture
 * @returns Estadísticas: posesión, tiros, córners, faltas, etc.
 */
export async function getMatchStatistics(fixtureId: number) {
  return fetchApi<ApiMatchStatistics[]>(
    "/fixtures/statistics",
    { fixture: fixtureId },
    86400 // Cache por 24 horas (las estadísticas no cambian)
  );
}

/**
 * Obtiene el historial de enfrentamientos directos (H2H) entre dos equipos.
 *
 * @param team1Id - ID del primer equipo
 * @param team2Id - ID del segundo equipo
 * @param last - Últimos N enfrentamientos (default: 20)
 * @returns Array de fixtures históricos entre ambos equipos
 */
export async function getHead2Head(
  team1Id: number,
  team2Id: number,
  last: number = 20
) {
  return fetchApi<ApiFixture[]>(
    "/fixtures/headtohead",
    { h2h: `${team1Id}-${team2Id}`, last },
    3600
  );
}

/**
 * Obtiene la tabla de posiciones de una liga.
 *
 * @param leagueId - ID de la liga
 * @param season - Año de la temporada
 * @returns Tabla de posiciones completa con estadísticas de cada equipo
 */
export async function getStandings(leagueId: number, season: number) {
  return fetchApi<ApiStandingResponse[]>(
    "/standings",
    { league: leagueId, season },
    1800
  );
}

// =============================================
// TIPOS DE RESPUESTA DE LA API
// =============================================
// Estos tipos definen la estructura de las respuestas de API-Football.
// Nos ayudan a tener type safety en todo el código.

/** Liga retornada por la API */
export interface ApiLeague {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string;
    flag: string;
  };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
  }>;
}

/** Equipo retornado por la API */
export interface ApiTeam {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    capacity: number;
    surface: string;
    city: string;
  };
}

/** Fixture (partido) retornado por la API */
export interface ApiFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: { first: number; second: number };
    venue: { id: number; name: string; city: string };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

/** Estadísticas de un partido */
export interface ApiMatchStatistics {
  team: { id: number; name: string; logo: string };
  statistics: Array<{
    type: string;
    value: string | number | null;
  }>;
}

/** Tabla de posiciones */
export interface ApiStandingResponse {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  standings: Array<Array<{
    rank: number;
    team: { id: number; name: string; logo: string };
    points: number;
    goalsDiff: number;
    group: string;
    form: string;
    status: string;
    description: string;
    all: {
      played: number;
      win: number;
      draw: number;
      lose: number;
      goals: { for: number; against: number };
    };
    home: {
      played: number;
      win: number;
      draw: number;
      lose: number;
      goals: { for: number; against: number };
    };
    away: {
      played: number;
      win: number;
      draw: number;
      lose: number;
      goals: { for: number; against: number };
    };
    update: string;
  }>>;
}
