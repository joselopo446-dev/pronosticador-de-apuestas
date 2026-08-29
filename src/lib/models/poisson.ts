// =============================================
// MODELO POISSON LOCAL (TypeScript)
// =============================================
// Implementa el modelo de distribución de Poisson para predecir
// resultados de fútbol. Se ejecuta en el servidor sin depender
// del servicio ML de Python.
//
// Fórmula: P(X=k) = (λ^k * e^(-λ)) / k!
// Donde λ = goles esperados del equipo

/**
 * Calcula la probabilidad de Poisson.
 * P(X=k) = (λ^k * e^(-λ)) / k!
 */
function poissonProbability(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Calcula el factorial de un número.
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Interfaz de entrada para el modelo Poisson.
 */
export interface PoissonInput {
  homeTeamAttack: number;   // Poder ofensivo del local (0-2)
  homeTeamDefense: number;  // Poder defensivo del local (0-2)
  awayTeamAttack: number;   // Poder ofensivo del visitante (0-2)
  awayTeamDefense: number;  // Poder defensivo del visitante (0-2)
  homeAdvantage?: number;   // Factor de localía (default: 1.3)
  maxGoals?: number;        // Máximo de goles a calcular (default: 6)
}

/**
 * Resultado del modelo Poisson.
 */
export interface PoissonResult {
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  scoreMatrix: number[][];  // Matriz de probabilidades de marcador exacto
  mostLikelyScore: {
    home: number;
    away: number;
    probability: number;
  };
  overUnder: {
    over25: number;
    under25: number;
    over35: number;
    under35: number;
  };
  btts: {
    yes: number;
    no: number;
  };
  explanation: PoissonExplanation;
}

/**
 * Explicación de la predicción.
 */
export interface PoissonExplanation {
  factors: Array<{
    name: string;
    value: number;
    impact: string;
    description: string;
  }>;
  summary: string;
}

/**
 * Ejecuta el modelo de Poisson para un partido.
 *
 * @param input - Datos de entrada de ambos equipos
 * @returns Probabilidades de resultado, goles esperados, marcador más probable
 */
export function predictMatch(input: PoissonInput): PoissonResult {
  const {
    homeTeamAttack,
    homeTeamDefense,
    awayTeamAttack,
    awayTeamDefense,
    homeAdvantage = 1.3,
    maxGoals = 6,
  } = input;

  // Calcular goles esperados usando el modelo de Dixon-Coles
  // λ = ataque_local * defensa_visitante * promedio_goles_liga * ventaja_local
  const avgGoalsPerMatch = 2.7; // Promedio histórico de goles por partido
  const expectedHomeGoals =
    homeTeamAttack * awayTeamDefense * (avgGoalsPerMatch / 2) * homeAdvantage;
  const expectedAwayGoals =
    awayTeamAttack * homeTeamDefense * (avgGoalsPerMatch / 2);

  // Calcular matriz de probabilidades de marcador
  const scoreMatrix: number[][] = [];
  for (let home = 0; home <= maxGoals; home++) {
    scoreMatrix[home] = [];
    for (let away = 0; away <= maxGoals; away++) {
      scoreMatrix[home][away] =
        poissonProbability(expectedHomeGoals, home) *
        poissonProbability(expectedAwayGoals, away);
    }
  }

  // Calcular probabilidades 1X2
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;

  for (let home = 0; home <= maxGoals; home++) {
    for (let away = 0; away <= maxGoals; away++) {
      const prob = scoreMatrix[home][away];
      if (home > away) homeWin += prob;
      else if (home === away) draw += prob;
      else awayWin += prob;
    }
  }

  // Encontrar marcador más probable
  let mostLikelyHome = 0;
  let mostLikelyAway = 0;
  let maxProb = 0;

  for (let home = 0; home <= maxGoals; home++) {
    for (let away = 0; away <= maxGoals; away++) {
      if (scoreMatrix[home][away] > maxProb) {
        maxProb = scoreMatrix[home][away];
        mostLikelyHome = home;
        mostLikelyAway = away;
      }
    }
  }

  // Calcular Over/Under
  let over25 = 0;
  let over35 = 0;

  for (let home = 0; home <= maxGoals; home++) {
    for (let away = 0; away <= maxGoals; away++) {
      const totalGoals = home + away;
      if (totalGoals > 2.5) over25 += scoreMatrix[home][away];
      if (totalGoals > 3.5) over35 += scoreMatrix[home][away];
    }
  }

  // Calcular BTTS (Both Teams To Score)
  let bttsYes = 0;
  for (let home = 1; home <= maxGoals; home++) {
    for (let away = 1; away <= maxGoals; away++) {
      bttsYes += scoreMatrix[home][away];
    }
  }

  // Generar explicación
  const factors = generateExplanationFactors(
    input,
    expectedHomeGoals,
    expectedAwayGoals
  );

  return {
    expectedHomeGoals: Math.round(expectedHomeGoals * 1000) / 1000,
    expectedAwayGoals: Math.round(expectedAwayGoals * 1000) / 1000,
    probabilities: {
      homeWin: Math.round(homeWin * 10000) / 10000,
      draw: Math.round(draw * 10000) / 10000,
      awayWin: Math.round(awayWin * 10000) / 10000,
    },
    scoreMatrix,
    mostLikelyScore: {
      home: mostLikelyHome,
      away: mostLikelyAway,
      probability: Math.round(maxProb * 10000) / 10000,
    },
    overUnder: {
      over25: Math.round(over25 * 10000) / 10000,
      under25: Math.round((1 - over25) * 10000) / 10000,
      over35: Math.round(over35 * 10000) / 10000,
      under35: Math.round((1 - over35) * 10000) / 10000,
    },
    btts: {
      yes: Math.round(bttsYes * 10000) / 10000,
      no: Math.round((1 - bttsYes) * 10000) / 10000,
    },
    explanation: {
      factors,
      summary: `El modelo Poisson estima ${expectedHomeGoals.toFixed(
        2
      )} goles para el local y ${expectedAwayGoals.toFixed(
        2
      )} para el visitante. Probabilidad de victoria local: ${(
        homeWin * 100
      ).toFixed(1)}%.`,
    },
  };
}

/**
 * Genera los factores de explicación de la predicción.
 */
function generateExplanationFactors(
  input: PoissonInput,
  expectedHome: number,
  expectedAway: number
) {
  const factors = [];

  // Factor de ataque local
  factors.push({
    name: "Ataque del local",
    value: input.homeTeamAttack,
    impact: input.homeTeamAttack > 1.2 ? "alto" : input.homeTeamAttack < 0.8 ? "bajo" : "medio",
    description: `Poder ofensivo de ${input.homeTeamAttack.toFixed(2)} (${
      input.homeTeamAttack > 1.2 ? "por encima del promedio" : "promedio"
    })`,
  });

  // Factor de defensa visitante
  factors.push({
    name: "Defensa del visitante",
    value: input.awayTeamDefense,
    impact: input.awayTeamDefense < 0.8 ? "alto" : input.awayTeamDefense > 1.2 ? "bajo" : "medio",
    description: `Solidez defensiva de ${input.awayTeamDefense.toFixed(2)} (${
      input.awayTeamDefense < 0.8 ? "muy sólida" : "estándar"
    })`,
  });

  // Factor de ventaja de localía
  factors.push({
    name: "Ventaja de localía",
    value: input.homeAdvantage ?? 1.3,
    impact: "medio",
    description: "Factor de ajuste por jugar en casa (1.3x promedio)",
  });

  // Factor de goles esperados
  factors.push({
    name: "Goles esperados",
    value: expectedHome + expectedAway,
    impact: expectedHome + expectedAway > 2.8 ? "alto" : "medio",
    description: `Total estimado: ${(expectedHome + expectedAway).toFixed(
      2
    )} goles en el partido`,
  });

  return factors;
}
