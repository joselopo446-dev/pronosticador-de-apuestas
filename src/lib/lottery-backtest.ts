// =============================================
// BACKTESTING DE ESTRATEGIAS DE LOTERÍA
// =============================================
// Prueba si las estrategias de generación realmente funcionan
// comparando predicciones con resultados históricos reales.

import type { LotteryDraw } from "@/types/loteria";

export interface BacktestResult {
  strategyName: string;
  totalDraws: number;
  matches: { three: number; four: number; five: number; six: number };
  matchRates: { three: number; four: number; five: number; six: number };
  expectedThree: number;
  expectedFour: number;
  expectedFive: number;
  expectedSix: number;
  roi: number; // Return on investment (negativo = pierde dinero, como toda lotería)
  verdict: string;
}

export interface BacktestSummary {
  results: BacktestResult[];
  bestStrategy: string;
  overallVerdict: string;
}

// ---- Probabilidades teóricas (para comparar) ----
function theoreticalProbability(matched: number, total: number, poolSize: number): number {
  const comb = (n: number, k: number): number => {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    let result = 1;
    for (let i = 0; i < k; i++) {
      result = (result * (n - i)) / (i + 1);
    }
    return result;
  };

  const totalCombinations = comb(poolSize, total);
  const waysToMatch = comb(total, matched) * comb(poolSize - total, total - matched);
  return waysToMatch / totalCombinations;
}

// ---- Estrategias de generación ----
function strategyFrecuencia(draws: LotteryDraw[], poolSize: number): number[] {
  const freq: Record<number, number> = {};
  const recent = draws.slice(0, 50); // Últimos 50 sorteos

  recent.forEach((d) => {
    d.mainNumbers.forEach((n) => {
      freq[n] = (freq[n] || 0) + 1;
    });
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([n]) => Number(n))
    .sort((a, b) => a - b);
}

function strategyAtrasados(draws: LotteryDraw[], poolSize: number): number[] {
  const lastSeen: Record<number, number> = {};

  draws.forEach((d, idx) => {
    d.mainNumbers.forEach((n) => {
      if (lastSeen[n] === undefined) lastSeen[n] = idx;
    });
  });

  // Llenar los que nunca aparecieron
  for (let i = 1; i <= poolSize; i++) {
    if (lastSeen[i] === undefined) lastSeen[i] = draws.length;
  }

  return Object.entries(lastSeen)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([n]) => Number(n))
    .sort((a, b) => a - b);
}

function strategyMixto(draws: LotteryDraw[], poolSize: number): number[] {
  const freqStrategy = strategyFrecuencia(draws, poolSize);
  const coldStrategy = strategyAtrasados(draws, poolSize);

  // 3 de frecuentes + 3 de atrasados
  const picked = new Set<number>();
  freqStrategy.slice(0, 3).forEach((n) => picked.add(n));
  coldStrategy.slice(0, 3).forEach((n) => picked.add(n));

  // Si hay duplicados, rellenar
  let idx = 3;
  while (picked.size < 6) {
    picked.add(freqStrategy[idx] || coldStrategy[idx]);
    idx++;
  }

  return Array.from(picked).sort((a, b) => a - b);
}

function strategyConsecutivos(draws: LotteryDraw[], poolSize: number): number[] {
  // Detectar secuencias frecuentes de 2-3 números
  const pairs: Record<string, number> = {};

  draws.slice(0, 50).forEach((d) => {
    const sorted = [...d.mainNumbers].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      const pair = `${sorted[i]}-${sorted[i + 1]}`;
      pairs[pair] = (pairs[pair] || 0) + 1;
    }
  });

  const topPairs = Object.entries(pairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([p]) => p.split("-").map(Number));

  const picked = new Set<number>();
  topPairs.forEach((pair) => pair.forEach((n) => picked.add(n)));

  // Rellenar si es necesario
  while (picked.size < 6) {
    picked.add(Math.floor(Math.random() * poolSize) + 1);
  }

  return Array.from(picked).sort((a, b) => a - b);
}

// ---- Backtesting principal ----
export function runBacktest(
  draws: LotteryDraw[],
  poolSize: number,
  lotteryId: string
): BacktestSummary {
  const testDraws = draws.slice(0, 50); // Probar en últimos 50 sorteos
  const historicalDraws = draws.slice(50); // Usar como datos de entrenamiento

  const strategies = [
    { name: "Frecuencia", fn: strategyFrecuencia },
    { name: "Atrasados", fn: strategyAtrasados },
    { name: "Mixto", fn: strategyMixto },
    { name: "Consecutivos", fn: strategyConsecutivos },
  ];

  const results: BacktestResult[] = strategies.map(({ name, fn }) => {
    let match3 = 0;
    let match4 = 0;
    let match5 = 0;
    let match6 = 0;

    testDraws.forEach((actualDraw) => {
      const predicted = fn(historicalDraws, poolSize);
      const actual = new Set(actualDraw.mainNumbers);
      const matched = predicted.filter((n) => actual.has(n)).length;

      if (matched >= 3) match3++;
      if (matched >= 4) match4++;
      if (matched >= 5) match5++;
      if (matched >= 6) match6++;
    });

    const total = testDraws.length;
    const exp3 = theoreticalProbability(3, 6, poolSize) * total;
    const exp4 = theoreticalProbability(4, 6, poolSize) * total;
    const exp5 = theoreticalProbability(5, 6, poolSize) * total;
    const exp6 = theoreticalProbability(6, 6, poolSize) * total;

    // ROI: asumiendo $20 por juego, premio promedio
    const costPerTicket = 20;
    const totalCost = total * costPerTicket;
    const prizeEstimate = match3 * 100 + match4 * 1000 + match5 * 50000 + match6 * 1000000;
    const roi = ((prizeEstimate - totalCost) / totalCost) * 100;

    let verdict: string;
    if (match6 > 0) verdict = "¡Sexta perfecta! (extremadamente raro)";
    else if (match5 > exp5 * 2) verdict = "Rendimiento superior al esperado";
    else if (match4 > exp4 * 1.5) verdict = "Rendimiento ligeramente superior";
    else if (match3 > exp3) verdict = "Rendimiento normal";
    else verdict = "Rendimiento inferior al esperado";

    return {
      strategyName: name,
      totalDraws: total,
      matches: { three: match3, four: match4, five: match5, six: match6 },
      matchRates: {
        three: (match3 / total) * 100,
        four: (match4 / total) * 100,
        five: (match5 / total) * 100,
        six: (match6 / total) * 100,
      },
      expectedThree: exp3,
      expectedFour: exp4,
      expectedFive: exp5,
      expectedSix: exp6,
      roi,
      verdict,
    };
  });

  const best = results.reduce((a, b) =>
    a.matches.five + a.matches.four > b.matches.five + b.matches.four ? a : b
  );

  return {
    results,
    bestStrategy: best.strategyName,
    overallVerdict:
      "Ninguna estrategia garantiza ganar la lotería. " +
      "Estos resultados muestran la variabilidad natural de los sorteos. " +
      "La lotería es un juego de azar — juega responsablemente.",
  };
}
