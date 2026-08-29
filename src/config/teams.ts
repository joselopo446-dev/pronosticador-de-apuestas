// =============================================
// CONFIGURACIÓN DE EQUIPOS
// =============================================
// Ratings de ataque/defensa para el modelo Poisson.
// Estos valores se actualizarán con datos reales de la API.

export interface TeamConfig {
  name: string;
  league: "liga-mx" | "la-liga";
  attack: number;
  defense: number;
}

export const TEAMS: TeamConfig[] = [
  // Liga MX
  { name: "Club América", league: "liga-mx", attack: 1.5, defense: 0.8 },
  { name: "Cruz Azul", league: "liga-mx", attack: 1.3, defense: 0.9 },
  { name: "Guadalajara (Chivas)", league: "liga-mx", attack: 1.1, defense: 1.0 },
  { name: "Tigres UANL", league: "liga-mx", attack: 1.4, defense: 0.85 },
  { name: "Monterrey", league: "liga-mx", attack: 1.35, defense: 0.9 },
  { name: "León", league: "liga-mx", attack: 1.2, defense: 1.05 },
  { name: "Pumas UNAM", league: "liga-mx", attack: 1.15, defense: 1.0 },
  { name: "Toluca", league: "liga-mx", attack: 1.1, defense: 1.1 },
  { name: "Santos Laguna", league: "liga-mx", attack: 1.05, defense: 1.15 },
  { name: "Atlas", league: "liga-mx", attack: 0.95, defense: 1.1 },
  { name: "Necaxa", league: "liga-mx", attack: 0.9, defense: 1.2 },
  { name: "Puebla", league: "liga-mx", attack: 0.85, defense: 1.25 },
  { name: "Mazatlán", league: "liga-mx", attack: 0.9, defense: 1.2 },
  { name: "Juárez", league: "liga-mx", attack: 0.8, defense: 1.3 },
  { name: "San Luis", league: "liga-mx", attack: 0.85, defense: 1.2 },
  // La Liga
  { name: "Real Madrid", league: "la-liga", attack: 1.6, defense: 0.7 },
  { name: "Barcelona", league: "la-liga", attack: 1.5, defense: 0.8 },
  { name: "Atlético Madrid", league: "la-liga", attack: 1.3, defense: 0.85 },
  { name: "Sevilla", league: "la-liga", attack: 1.1, defense: 0.95 },
  { name: "Real Sociedad", league: "la-liga", attack: 1.15, defense: 0.9 },
  { name: "Villarreal", league: "la-liga", attack: 1.2, defense: 0.95 },
  { name: "Athletic Bilbao", league: "la-liga", attack: 1.1, defense: 0.9 },
  { name: "Valencia", league: "la-liga", attack: 1.05, defense: 1.0 },
  { name: "Real Betis", league: "la-liga", attack: 1.1, defense: 1.0 },
  { name: "Osasuna", league: "la-liga", attack: 1.0, defense: 1.05 },
];

export function getTeamsByLeague(league: "liga-mx" | "la-liga"): TeamConfig[] {
  return TEAMS.filter((t) => t.league === league);
}
