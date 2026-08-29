// =============================================
// TIPOS DEL DOMINIO DE LOTERÍA
// =============================================
// Tipos para el módulo de análisis de loterías mexicanas.
// Estos tipos representan la estructura de datos que almacenamos
// en nuestra base de datos PostgreSQL.

/**
 * Configuración de una lotería
 */
export interface Lottery {
  id: string;
  name: string;
  slug: string;
  country: string;
  mainNumbersCount: number;
  mainNumbersMin: number;
  mainNumbersMax: number;
  bonusNumbersCount: number;
  bonusNumbersMin: number | null;
  bonusNumbersMax: number | null;
  drawDays: string[];
}

/**
 * Resultado de un sorteo específico
 */
export interface LotteryDraw {
  id: string;
  lotteryId: string;
  drawNumber: string;
  drawDate: string;
  mainNumbers: number[];
  bonusNumber: number | null;
  jackpotAmount: number | null;
}

/**
 * Frecuencia de aparición de un número
 */
export interface NumberFrequency {
  number: number;
  absoluteFrequency: number;
  relativeFrequency: number;
  drawsSinceLast: number;
  avgDrawsBetween: number;
  temperature: "hot" | "warm" | "cold";
  lastDrawDate: string;
}

/**
 * Coocurrencia entre dos números
 * Indica cuántas veces han salido juntos en el mismo sorteo.
 */
export interface Cooccurrence {
  numberA: number;
  numberB: number;
  cooccurrenceCount: number;
  totalDraws: number;
  cooccurrenceRate: number;
}

/**
 * Patrón detectado en los datos históricos
 */
export interface LotteryPattern {
  id: string;
  lotteryId: string;
  type: string;
  description: string;
  observations: number;
  statisticalSignificance: number;
  confidenceLevel: "alta" | "media" | "baja";
  methodUsed: string;
  isPredictive: boolean;
}

/**
 * Combinación generada por una estrategia
 */
export interface GeneratedCombination {
  numbers: number[];
  strategy: string;
  criteria: Record<string, unknown>;
  generatedAt: string;
}

/**
 * Resultado de backtesting de una estrategia
 */
export interface BacktestResult {
  strategy: string;
  totalDraws: number;
  avgMatches: number;
  bestMatch: number;
  roi: number; // Return on Investment (%)
  isBetterThanRandom: boolean;
  statisticalSignificance: number;
}
