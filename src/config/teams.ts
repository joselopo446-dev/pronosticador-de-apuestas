// =============================================
// CONFIGURACIÓN DE EQUIPOS
// =============================================
// Ratings de ataque/defensa para el modelo Poisson.
// Estos valores se actualizarán con datos reales de la API.

export interface TeamConfig {
  id: number;
  name: string;
  league: "liga-mx" | "la-liga";
  attack: number;
  defense: number;
}

export const TEAMS: TeamConfig[] = [
  // Liga MX
  { id: 1, name: "Club América", league: "liga-mx", attack: 1.5, defense: 0.8 },
  { id: 2, name: "Cruz Azul", league: "liga-mx", attack: 1.3, defense: 0.9 },
  { id: 3, name: "Guadalajara (Chivas)", league: "liga-mx", attack: 1.1, defense: 1.0 },
  { id: 4, name: "Tigres UANL", league: "liga-mx", attack: 1.4, defense: 0.85 },
  { id: 5, name: "Monterrey", league: "liga-mx", attack: 1.35, defense: 0.9 },
  { id: 6, name: "León", league: "liga-mx", attack: 1.2, defense: 1.05 },
  { id: 7, name: "Pumas UNAM", league: "liga-mx", attack: 1.15, defense: 1.0 },
  { id: 8, name: "Toluca", league: "liga-mx", attack: 1.1, defense: 1.1 },
  { id: 9, name: "Santos Laguna", league: "liga-mx", attack: 1.05, defense: 1.15 },
  { id: 10, name: "Atlas", league: "liga-mx", attack: 0.95, defense: 1.1 },
  { id: 11, name: "Necaxa", league: "liga-mx", attack: 0.9, defense: 1.2 },
  { id: 12, name: "Puebla", league: "liga-mx", attack: 0.85, defense: 1.25 },
  { id: 13, name: "Mazatlán", league: "liga-mx", attack: 0.9, defense: 1.2 },
  { id: 14, name: "Juárez", league: "liga-mx", attack: 0.8, defense: 1.3 },
  { id: 15, name: "San Luis", league: "liga-mx", attack: 0.85, defense: 1.2 },
  // La Liga
  { id: 16, name: "Real Madrid", league: "la-liga", attack: 1.6, defense: 0.7 },
  { id: 17, name: "Barcelona", league: "la-liga", attack: 1.5, defense: 0.8 },
  { id: 18, name: "Atlético Madrid", league: "la-liga", attack: 1.3, defense: 0.85 },
  { id: 19, name: "Sevilla", league: "la-liga", attack: 1.1, defense: 0.95 },
  { id: 20, name: "Real Sociedad", league: "la-liga", attack: 1.15, defense: 0.9 },
  { id: 21, name: "Villarreal", league: "la-liga", attack: 1.2, defense: 0.95 },
  { id: 22, name: "Athletic Bilbao", league: "la-liga", attack: 1.1, defense: 0.9 },
  { id: 23, name: "Valencia", league: "la-liga", attack: 1.05, defense: 1.0 },
  { id: 24, name: "Real Betis", league: "la-liga", attack: 1.1, defense: 1.0 },
  { id: 25, name: "Osasuna", league: "la-liga", attack: 1.0, defense: 1.05 },
];

export function getTeamsByLeague(league: "liga-mx" | "la-liga"): TeamConfig[] {
  return TEAMS.filter((t) => t.league === league);
}

export function getTeamRatings(teamId: number): { attack: number; defense: number } {
  const team = TEAMS.find((t) => t.id === teamId);
  if (!team) return { attack: 1.0, defense: 1.0 };
  return { attack: team.attack, defense: team.defense };
}
