// =============================================
// EXPORTACIONES CENTRALIZADAS DE TIPOS
// =============================================
// Este archivo re-exporta todos los tipos del proyecto desde un solo lugar.
// Permite importar tipos así: import { League, Fixture } from "@/types"

// Tipos del dominio deportivo
export type {
  League,
  Team,
  Fixture,
  Standing,
  MatchStatistics,
  Prediction,
} from "./deportes";

// Tipos del dominio de lotería
export type {
  Lottery,
  LotteryDraw,
  NumberFrequency,
  Cooccurrence,
  LotteryPattern,
  GeneratedCombination,
  BacktestResult,
} from "./loteria";

// Tipos de la base de datos
export type { Database, Json } from "./database";
