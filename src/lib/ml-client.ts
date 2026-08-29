// =============================================
// CLIENTE DEL SERVICIO ML (FastAPI)
// =============================================
// Se comunica con el servicio de Machine Learning en Fly.io.

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

async function fetchMlService<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${ML_SERVICE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(`ML Service Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

export async function executePoissonModel(params: {
  homeTeamAttack: number;
  homeTeamDefense: number;
  awayTeamAttack: number;
  awayTeamDefense: number;
  homeAdvantage?: number;
}) {
  return fetchMlService<{
    expected_home_goals: number;
    expected_away_goals: number;
    probabilities: { home_win: number; draw: number; away_win: number };
    most_likely_score: { home: number; away: number; probability: number };
    over_under: { over25: number; under25: number };
    btts: { yes: number; no: number };
    explanation: { factors: Array<{ name: string; impact: string; description: string }>; summary: string };
  }>("/api/v1/sports/poisson", "POST", params);
}

export async function generateLotteryCombination(
  lotteryId: string,
  strategy: string
) {
  return fetchMlService<{ numbers: number[]; strategy: string }>(
    "/api/v1/lottery/generate",
    "POST",
    { lottery_id: lotteryId, strategy }
  );
}
