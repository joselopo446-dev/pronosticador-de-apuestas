// =============================================
// SISTEMA DE BACKTESTING Y OPTIMIZACIÓN
// =============================================
// Evalúa y optimiza los pesos del modelo predictivo

import { createClient } from "@supabase/supabase-js";
import { predictMatch, type PredictionResult } from "./quiniela-predictor";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface BacktestResult {
  totalMatches: number;
  correctPredictions: number;
  accuracy: number;
  profitLoss: number;
  roi: number;
  avgConfidence: number;
  byType: {
    homeWins: { total: number; correct: number; accuracy: number };
    draws: { total: number; correct: number; accuracy: number };
    awayWins: { total: number; correct: number; accuracy: number };
  };
  byConfidence: {
    high: { total: number; correct: number; accuracy: number };
    medium: { total: number; correct: number; accuracy: number };
    low: { total: number; correct: number; accuracy: number };
  };
}

export interface OptimizedWeights {
  poisson: number;
  elo: number;
  form: number;
  h2h: number;
  context: number;
  accuracy: number;
}

// =============================================
// BACKTESTING COMPLETO
// =============================================
export async function runBacktest(
  startDate?: string,
  endDate?: string
): Promise<BacktestResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Obtener partidos con resultado
  let query = supabase
    .from("match_history")
    .select("*")
    .order("match_date", { ascending: false })
    .limit(200);

  if (startDate) query = query.gte("match_date", startDate);
  if (endDate) query = query.lte("match_date", endDate);

  const { data: matches, error } = await query;

  if (error || !matches || matches.length === 0) {
    return {
      totalMatches: 0,
      correctPredictions: 0,
      accuracy: 0,
      profitLoss: 0,
      roi: 0,
      avgConfidence: 0,
      byType: {
        homeWins: { total: 0, correct: 0, accuracy: 0 },
        draws: { total: 0, correct: 0, accuracy: 0 },
        awayWins: { total: 0, correct: 0, accuracy: 0 },
      },
      byConfidence: {
        high: { total: 0, correct: 0, accuracy: 0 },
        medium: { total: 0, correct: 0, accuracy: 0 },
        low: { total: 0, correct: 0, accuracy: 0 },
      },
    };
  }

  let correctPredictions = 0;
  let totalConfidence = 0;
  const profitLoss = 0;

  const byType = {
    homeWins: { total: 0, correct: 0, accuracy: 0 },
    draws: { total: 0, correct: 0, accuracy: 0 },
    awayWins: { total: 0, correct: 0, accuracy: 0 },
  };

  const byConfidence = {
    high: { total: 0, correct: 0, accuracy: 0 },
    medium: { total: 0, correct: 0, accuracy: 0 },
    low: { total: 0, correct: 0, accuracy: 0 },
  };

  for (const match of matches) {
    try {
      // Generar predicción
      const prediction = await predictMatch(match.home_team, match.away_team);

      // Determinar resultado real
      let actualResult = "X";
      if (match.home_goals > match.away_goals) actualResult = "1";
      else if (match.home_goals < match.away_goals) actualResult = "2";

      // Verificar si acertó
      const isCorrect = prediction.prediction === actualResult;
      if (isCorrect) correctPredictions++;

      totalConfidence += prediction.confidence;

      // Estadísticas por tipo
      if (actualResult === "1") {
        byType.homeWins.total++;
        if (isCorrect) byType.homeWins.correct++;
      } else if (actualResult === "X") {
        byType.draws.total++;
        if (isCorrect) byType.draws.correct++;
      } else {
        byType.awayWins.total++;
        if (isCorrect) byType.awayWins.correct++;
      }

      // Estadísticas por confianza
      if (prediction.confidence >= 0.5) {
        byConfidence.high.total++;
        if (isCorrect) byConfidence.high.correct++;
      } else if (prediction.confidence >= 0.35) {
        byConfidence.medium.total++;
        if (isCorrect) byConfidence.medium.correct++;
      } else {
        byConfidence.low.total++;
        if (isCorrect) byConfidence.low.correct++;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (e) {
      // Saltar partidos con error
    }
  }

  // Calcular accuracies
  const total = matches.length;
  const accuracy = total > 0 ? correctPredictions / total : 0;
  const avgConfidence = total > 0 ? totalConfidence / total : 0;

  byType.homeWins.accuracy = byType.homeWins.total > 0 
    ? byType.homeWins.correct / byType.homeWins.total : 0;
  byType.draws.accuracy = byType.draws.total > 0 
    ? byType.draws.correct / byType.draws.total : 0;
  byType.awayWins.accuracy = byType.awayWins.total > 0 
    ? byType.awayWins.correct / byType.awayWins.total : 0;

  byConfidence.high.accuracy = byConfidence.high.total > 0 
    ? byConfidence.high.correct / byConfidence.high.total : 0;
  byConfidence.medium.accuracy = byConfidence.medium.total > 0 
    ? byConfidence.medium.correct / byConfidence.medium.total : 0;
  byConfidence.low.accuracy = byConfidence.low.total > 0 
    ? byConfidence.low.correct / byConfidence.low.total : 0;

  return {
    totalMatches: total,
    correctPredictions,
    accuracy,
    profitLoss,
    roi: 0,
    avgConfidence,
    byType,
    byConfidence,
  };
}

// =============================================
// OPTIMIZACIÓN DE PESOS (Grid Search)
// =============================================
export async function optimizeWeights(): Promise<OptimizedWeights[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Obtener partidos para entrenamiento
  const { data: matches } = await supabase
    .from("match_history")
    .select("*")
    .order("match_date", { ascending: false })
    .limit(100);

  if (!matches || matches.length === 0) {
    return [];
  }

  const results: OptimizedWeights[] = [];

  // Grid search simplificado
  const poissonWeights = [0.2, 0.25, 0.3, 0.35, 0.4];
  const eloWeights = [0.15, 0.2, 0.25];
  const formWeights = [0.15, 0.2, 0.25];
  const h2hWeights = [0.1, 0.15, 0.2];

  for (const pw of poissonWeights) {
    for (const ew of eloWeights) {
      for (const fw of formWeights) {
        for (const hw of h2hWeights) {
          const cw = 1 - pw - ew - fw - hw;
          if (cw < 0.05 || cw > 0.25) continue;

          // Evaluar esta combinación
          let correct = 0;
          let total = 0;

          for (const match of matches.slice(0, 50)) {
            try {
              // Aquí iría la predicción con pesos personalizados
              // Por ahora usamos el predictor default
              const prediction = await predictMatch(match.home_team, match.away_team);
              
              let actual = "X";
              if (match.home_goals > match.away_goals) actual = "1";
              else if (match.home_goals < match.away_goals) actual = "2";

              if (prediction.prediction === actual) correct++;
              total++;

              await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (e) {
              // Skip
            }
          }

          const accuracy = total > 0 ? correct / total : 0;
          results.push({
            poisson: pw,
            elo: ew,
            form: fw,
            h2h: hw,
            context: cw,
            accuracy,
          });
        }
      }
    }
  }

  // Ordenar por accuracy
  results.sort((a, b) => b.accuracy - a.accuracy);

  return results.slice(0, 10);
}
