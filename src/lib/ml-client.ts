// =============================================
// CLIENTE DEL SERVICIO ML (FastAPI)
// =============================================
// Este archivo se comunica con el servicio de Machine Learning en Python.
// Por ahora es un placeholder que será implementado cuando creemos el servicio FastAPI.
//
// Arquitectura:
//   Frontend (Next.js) → API Route → FastAPI (Python) → Modelos ML
//
// ¿Por qué un servicio separado?
// - Python tiene el ecosistema ML más maduro (pandas, scikit-learn, XGBoost)
// - Next.js no puede ejecutar modelos de ML directamente
// - Permite escalar el ML independientemente del frontend

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Función genérica para llamar al servicio ML.
 *
 * @param endpoint - Ruta del endpoint (ej: "/api/v1/sports/poisson")
 * @param method - Método HTTP (GET, POST)
 * @param body - Cuerpo de la petición (opcional, para POST)
 * @returns La respuesta del servicio ML
 */
async function fetchMlService<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${ML_SERVICE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(
      `ML Service Error: ${response.status} - ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Ejecuta el modelo Poisson para un partido específico.
 *
 * @param matchId - ID del partido en la base de datos
 * @returns Predicción con probabilidades 1X2, goles esperados, etc.
 *
 * Ejemplo de respuesta:
 * {
 *   prob_home_win: 0.45,
 *   prob_draw: 0.25,
 *   prob_away_win: 0.30,
 *   expected_home_goals: 1.8,
 *   expected_away_goals: 1.2,
 *   most_likely_score: "2-1"
 * }
 */
export async function executePoissonModel(matchId: string) {
  // TODO: Implementar cuando el servicio ML esté listo
  // return fetchMlService(`/api/v1/sports/poisson`, "POST", { match_id: matchId });
  console.log("ML Service no disponible aún. Match ID:", matchId);
  return null;
}

/**
 * Genera una combinación de lotería usando各种 estrategias.
 *
 * @param lotteryId - ID de la lotería
 * @param strategy - Estrategia a usar (frequency, overdue, ensemble, etc.)
 * @returns Números generados con la estrategia seleccionada
 */
export async function generateLotteryCombination(
  lotteryId: string,
  strategy: string
) {
  // TODO: Implementar cuando el servicio ML esté listo
  // return fetchMlService(`/api/v1/lottery/generate`, "POST", {
  //   lottery_id: lotteryId,
  //   strategy,
  // });
  console.log("ML Service no disponible aún. Lottery:", lotteryId, "Strategy:", strategy);
  return null;
}
