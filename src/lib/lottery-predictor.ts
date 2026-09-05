// =============================================
// SERVICIO DE PREDICCIÓN DE LOTERÍA MEJORADO
// =============================================
// Usa análisis estadístico avanzado, patrones temporales,
// frecuencia, relaciones entre números y machine learning básico.

import type { LotteryDraw } from "@/types/loteria";

// =============================================
// TIPOS
// =============================================

export interface PredictionResult {
  numbers: number[];
  confidence: number;
  factors: Array<{
    name: string;
    value: string;
    impact: "alto" | "medio" | "bajo";
    description: string;
  }>;
  strategies: string[];
  statistics: {
    hotNumbers: number[];
    coldNumbers: number[];
    overdueNumbers: number[];
    frequentPairs: number[][];
    avgSum: number;
    avgOddCount: number;
    trend: string;
  };
}

export interface NumberStats {
  number: number;
  frequency: number;
  lastSeen: number; // draws ago
  avgGap: number;
  trend: "hot" | "warm" | "cold" | "overdue";
}

// =============================================
// ANÁLISIS ESTADÍSTICO
// =============================================

function getMaxNumber(lotteryId: string): number {
  switch (lotteryId) {
    case "melate": return 56;
    case "revancha": return 56;
    case "super-lotto": return 45;
    default: return 56;
  }
}

function getCountNumbers(lotteryId: string): number {
  return 6; // Todas las loterías usan 6 números
}

// Calcula frecuencia de cada número
function calculateFrequency(history: LotteryDraw[], maxNum: number): NumberStats[] {
  const freq = new Map<number, number>();
  const lastSeen = new Map<number, number>();
  
  for (let i = 1; i <= maxNum; i++) {
    freq.set(i, 0);
    lastSeen.set(i, history.length);
  }

  history.forEach((draw, drawIndex) => {
    draw.mainNumbers.forEach((num) => {
      freq.set(num, (freq.get(num) || 0) + 1);
      lastSeen.set(num, drawIndex);
    });
  });

  const avgFrequency = history.length * 6 / maxNum;

  return Array.from({ length: maxNum }, (_, i) => i + 1).map((num) => {
    const f = freq.get(num) || 0;
    const ls = lastSeen.get(num) || history.length;
    const gap = ls === 0 ? 1 : ls;
    
    let trend: "hot" | "warm" | "cold" | "overdue";
    if (f > avgFrequency * 1.3 && ls < 5) trend = "hot";
    else if (f > avgFrequency * 1.1) trend = "warm";
    else if (ls > 15) trend = "overdue";
    else trend = "cold";

    return {
      number: num,
      frequency: f,
      lastSeen: ls,
      avgGap: history.length / Math.max(f, 1),
      trend,
    };
  });
}

// Números calientes (frecuentes recientes)
function getHotNumbers(stats: NumberStats[], count: number): number[] {
  return stats
    .sort((a, b) => {
      if (a.trend === "hot" && b.trend !== "hot") return -1;
      if (b.trend === "hot" && a.trend !== "hot") return 1;
      if (a.lastSeen !== b.lastSeen) return a.lastSeen - b.lastSeen;
      return b.frequency - a.frequency;
    })
    .slice(0, count)
    .map((s) => s.number);
}

// Números fríos (poco frecuentes)
function getColdNumbers(stats: NumberStats[], count: number): number[] {
  return stats
    .sort((a, b) => a.frequency - b.frequency)
    .slice(0, count)
    .map((s) => s.number);
}

// Números atrasados (no salen hace mucho)
function getOverdueNumbers(stats: NumberStats[], count: number): number[] {
  return stats
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, count)
    .map((s) => s.number);
}

// Pares frecuentes
function getFrequentPairs(history: LotteryDraw[], count: number): number[][] {
  const pairFreq = new Map<string, number>();
  
  history.forEach((draw) => {
    const nums = draw.mainNumbers.sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        pairFreq.set(key, (pairFreq.get(key) || 0) + 1);
      }
    }
  });

  return Array.from(pairFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key]) => key.split("-").map(Number));
}

// Análisis de suma
function analyzeSum(history: LotteryDraw[]): { avg: number; min: number; max: number; std: number } {
  const sums = history.map((d) => d.mainNumbers.reduce((a, b) => a + b, 0));
  const avg = sums.reduce((a, b) => a + b, 0) / sums.length;
  const variance = sums.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / sums.length;
  return {
    avg: Math.round(avg),
    min: Math.min(...sums),
    max: Math.max(...sums),
    std: Math.round(Math.sqrt(variance)),
  };
}

// Análisis de pares/impares
function analyzeOddEven(history: LotteryDraw[]): { avgOdd: number; avgEven: number } {
  const oddCounts = history.map((d) => d.mainNumbers.filter((n) => n % 2 === 1).length);
  const avgOdd = oddCounts.reduce((a, b) => a + b, 0) / oddCounts.length;
  return { avgOdd: Math.round(avgOdd), avgEven: 6 - Math.round(avgOdd) };
}

// Análisis de alta/baja
function analyzeHighLow(history: LotteryDraw[], maxNum: number): { avgHigh: number; avgLow: number } {
  const mid = maxNum / 2;
  const highCounts = history.map((d) => d.mainNumbers.filter((n) => n > mid).length);
  const avgHigh = highCounts.reduce((a, b) => a + b, 0) / highCounts.length;
  return { avgHigh: Math.round(avgHigh), avgLow: 6 - Math.round(avgHigh) };
}

// Detectar tendencia reciente
function detectTrend(history: LotteryDraw[]): string {
  if (history.length < 10) return "insuficiente";
  
  const recent = history.slice(0, 5);
  const older = history.slice(5, 15);
  
  const recentAvg = recent.reduce((a, d) => a + d.mainNumbers.reduce((s, n) => s + n, 0), 0) / recent.length;
  const olderAvg = older.reduce((a, d) => a + d.mainNumbers.reduce((s, n) => s + n, 0), 0) / older.length;
  
  if (recentAvg > olderAvg + 5) return "números altos en aumento";
  if (recentAvg < olderAvg - 5) return "números bajos en aumento";
  return "estable";
}

// =============================================
// ESTRATEGIAS DE PREDICCIÓN
// =============================================

// Estrategia 1: Números calientes + fríos balanceados
function strategyHotCold(stats: NumberStats[], maxNum: number, count: number): number[] {
  const hot = getHotNumbers(stats, Math.ceil(count * 0.6));
  const cold = getColdNumbers(stats, Math.floor(count * 0.4));
  return [...hot, ...cold].sort((a, b) => a - b).slice(0, count);
}

// Estrategia 2: Números atrasados (deben salir)
function strategyOverdue(stats: NumberStats[], count: number): number[] {
  return getOverdueNumbers(stats, count).sort((a, b) => a - b);
}

// Estrategia 3: Patrones de suma óptima
function strategySumOptimal(history: LotteryDraw[], maxNum: number, count: number): number[] {
  const sumAnalysis = analyzeSum(history);
  const targetSum = sumAnalysis.avg;
  
  const numbers: number[] = [];
  let currentSum = 0;
  
  for (let i = 0; i < count; i++) {
    const remaining = count - i - 1;
    const avgNeeded = (targetSum - currentSum) / (remaining + 1);
    const num = Math.min(maxNum, Math.max(1, Math.round(avgNeeded + (Math.random() * 10 - 5))));
    
    if (!numbers.includes(num)) {
      numbers.push(num);
      currentSum += num;
    }
  }
  
  return numbers.sort((a, b) => a - b);
}

// Estrategia 4: Pares frecuentes + complemento
function strategyFrequentPairs(history: LotteryDraw[], stats: NumberStats[], count: number): number[] {
  const pairs = getFrequentPairs(history, 10);
  const numbers = new Set<number>();
  
  // Tomar el par más frecuente
  if (pairs.length > 0) {
    pairs[0].forEach((n) => numbers.add(n));
  }
  
  // Complementar con números calientes
  const hot = getHotNumbers(stats, count * 2);
  for (const n of hot) {
    if (numbers.size >= count) break;
    numbers.add(n);
  }
  
  return Array.from(numbers).sort((a, b) => a - b).slice(0, count);
}

// Estrategia 5: Balance pares/impares + alta/baja
function strategyBalanced(history: LotteryDraw[], maxNum: number, count: number): number[] {
  const oddEven = analyzeOddEven(history);
  const highLow = analyzeHighLow(history, maxNum);
  
  const numbers: number[] = [];
  const mid = maxNum / 2;
  
  // Agregar números según distribución histórica
  for (let i = 0; i < oddEven.avgOdd; i++) {
    const odd = Math.floor(Math.random() * Math.ceil(mid)) * 2 + 1;
    if (!numbers.includes(odd) && odd <= maxNum) numbers.push(odd);
  }
  
  for (let i = 0; i < oddEven.avgEven; i++) {
    const even = Math.floor(Math.random() * Math.ceil(mid)) * 2;
    if (!numbers.includes(even) && even > 0 && even <= maxNum) numbers.push(even);
  }
  
  // Completar si faltan números
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * maxNum) + 1;
    if (!numbers.includes(num)) numbers.push(num);
  }
  
  return numbers.sort((a, b) => a - b).slice(0, count);
}

// Estrategia 6: Machine Learning simple (promedio ponderado)
function strategyML(history: LotteryDraw[], stats: NumberStats[], maxNum: number, count: number): number[] {
  // Pesos: frecuencia (40%), recencia (30%), tendencia (30%)
  const scores = new Map<number, number>();
  
  const maxFreq = Math.max(...stats.map((s) => s.frequency));
  const maxLastSeen = Math.max(...stats.map((s) => s.lastSeen));
  
  stats.forEach((s) => {
    const freqScore = s.frequency / maxFreq;
    const recencyScore = 1 - (s.lastSeen / maxLastSeen);
    const trendScore = s.trend === "hot" ? 1 : s.trend === "warm" ? 0.7 : s.trend === "overdue" ? 0.9 : 0.3;
    
    const totalScore = freqScore * 0.4 + recencyScore * 0.3 + trendScore * 0.3;
    scores.set(s.number, totalScore);
  });
  
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([num]) => num)
    .sort((a, b) => a - b);
}

// =============================================
// PREDICCIÓN PRINCIPAL
// =============================================

export function generatePrediction(
  lotteryId: string,
  strategy: string = "ensemble",
  draws?: LotteryDraw[]
): PredictionResult {
  const history = draws || [];
  const maxNum = getMaxNumber(lotteryId);
  const count = getCountNumbers(lotteryId);
  
  if (history.length === 0) {
    throw new Error("No hay datos históricos disponibles");
  }

  const stats = calculateFrequency(history, maxNum);
  const sumAnalysis = analyzeSum(history);
  const oddEven = analyzeOddEven(history);
  const highLow = analyzeHighLow(history, maxNum);
  const trend = detectTrend(history);
  const frequentPairs = getFrequentPairs(history, 5);

  let numbers: number[] = [];
  const strategiesUsed: string[] = [];

  switch (strategy) {
    case "hot-cold":
      numbers = strategyHotCold(stats, maxNum, count);
      strategiesUsed.push("Números calientes y fríos");
      break;
    case "overdue":
      numbers = strategyOverdue(stats, count);
      strategiesUsed.push("Números atrasados");
      break;
    case "sum-optimal":
      numbers = strategySumOptimal(history, maxNum, count);
      strategiesUsed.push("Suma óptima");
      break;
    case "frequent-pairs":
      numbers = strategyFrequentPairs(history, stats, count);
      strategiesUsed.push("Pares frecuentes");
      break;
    case "balanced":
      numbers = strategyBalanced(history, maxNum, count);
      strategiesUsed.push("Balance pares/impares");
      break;
    case "ml":
      numbers = strategyML(history, stats, maxNum, count);
      strategiesUsed.push("Machine Learning");
      break;
    case "ensemble":
    default:
      // Ensemble: combinar las mejores predicciones
      const hotCold = strategyHotCold(stats, maxNum, count);
      const overdue = strategyOverdue(stats, count);
      const ml = strategyML(history, stats, maxNum, count);
      const balanced = strategyBalanced(history, maxNum, count);
      
      // Contar frecuencia de cada número en las predicciones
      const votes = new Map<number, number>();
      [hotCold, overdue, ml, balanced].forEach((pred) => {
        pred.forEach((n) => votes.set(n, (votes.get(n) || 0) + 1));
      });
      
      // Tomar los números con más votos
      numbers = Array.from(votes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([num]) => num)
        .sort((a, b) => a - b);
      
      strategiesUsed.push("Ensemble (calientes+fríos+atrasados+ML+balance)");
      break;
  }

  // Calcular confianza
  const confidence = Math.min(0.85, 0.5 + (history.length / 1000) * 0.2 + (strategy === "ensemble" ? 0.1 : 0));

  // Factores de explicación
  const factors = [
    {
      name: "Frecuencia histórica",
      value: `${history.length} sorteos analizados`,
      impact: "alto" as const,
      description: `Se analizaron ${history.length} sorteos para identificar patrones`,
    },
    {
      name: "Suma promedio",
      value: sumAnalysis.avg.toString(),
      impact: "medio" as const,
      description: `La suma promedio de los números ganadores es ${sumAnalysis.avg}`,
    },
    {
      name: "Distribución par/impar",
      value: `${oddEven.avgOdd} impares / ${oddEven.avgEven} pares`,
      impact: "medio" as const,
      description: `Históricamente salen ${oddEven.avgOdd} números impares y ${oddEven.avgEven} pares`,
    },
    {
      name: "Tendencia",
      value: trend,
      impact: "bajo" as const,
      description: `La tendencia reciente es: ${trend}`,
    },
  ];

  return {
    numbers,
    confidence,
    factors,
    strategies: strategiesUsed,
    statistics: {
      hotNumbers: getHotNumbers(stats, 10),
      coldNumbers: getColdNumbers(stats, 10),
      overdueNumbers: getOverdueNumbers(stats, 10),
      frequentPairs,
      avgSum: sumAnalysis.avg,
      avgOddCount: oddEven.avgOdd,
      trend,
    },
  };
}

// =============================================
// GENERAR MÚLTIPLES COMBINACIONES
// =============================================

export function generateMultipleCombinations(
  lotteryId: string,
  count: number = 5,
  strategy: string = "ensemble",
  draws?: LotteryDraw[]
): PredictionResult[] {
  const results: PredictionResult[] = [];
  
  for (let i = 0; i < count; i++) {
    // Variar ligeramente la estrategia para cada combinación
    const variedStrategy = i === 0 ? strategy : 
      i % 2 === 0 ? "ensemble" : 
      i % 3 === 0 ? "hot-cold" : "ml";
    
    results.push(generatePrediction(lotteryId, variedStrategy, draws));
  }
  
  return results;
}
