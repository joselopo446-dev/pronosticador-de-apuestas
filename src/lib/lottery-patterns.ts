// =============================================
// ANÁLISIS DE PATRONES DE LOTERÍA
// =============================================
// Analiza patrones en números ganadores: suma, pares/impares,
// distribución, patrones temporales, relación con sorteos anteriores.

import type { LotteryDraw } from "@/types/loteria";

// ---- Tipos de salida ----
export interface NumberPattern {
  name: string;
  description: string;
  frequency: number;
  percentage: number;
  trend: "up" | "down" | "stable";
  recentCount: number;
  expectedCount: number;
}

export interface SumPattern {
  range: string;
  count: number;
  percentage: number;
  isHot: boolean;
}

export interface TemporalPattern {
  type: string;
  description: string;
  confidence: number;
  data: Record<string, number>;
}

export interface SequencePattern {
  pattern: string;
  frequency: number;
  description: string;
}

export interface PatternAnalysis {
  sumAnalysis: SumPattern[];
  oddEvenAnalysis: { oddCount: number; evenCount: number; ratio: string; dominant: string };
  highLowAnalysis: { highCount: number; lowCount: number; ratio: string };
  consecutiveAnalysis: { hasConsecutive: boolean; frequency: number; percentage: number };
  repeatAnalysis: { fromLastDraw: number; fromLastTwo: number; percentage: number };
  digitSumAnalysis: { digitSumRange: string; frequency: number }[];
  temporalPatterns: TemporalPattern[];
  sequencePatterns: SequencePattern[];
  numberRelationships: { primeCount: number; fibonacciCount: number; compositeCount: number };
}

// ---- Helpers ----
function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function isFibonacci(n: number): boolean {
  const fibs = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
  return fibs.includes(n);
}

function digitSum(n: number): number {
  return String(n)
    .split("")
    .reduce((s, d) => s + Number(d), 0);
}

function getSumRange(sum: number): string {
  if (sum <= 60) return "Muy baja (≤60)";
  if (sum <= 90) return "Baja (61-90)";
  if (sum <= 120) return "Media (91-120)";
  if (sum <= 150) return "Alta (121-150)";
  return "Muy alta (>150)";
}

// ---- Análisis principal ----
export function analyzePatterns(
  draws: LotteryDraw[],
  recentCount: number = 30
): PatternAnalysis {
  const recent = draws.slice(0, recentCount);
  const historical = draws;

  return {
    sumAnalysis: analyzeSumPatterns(historical, recent),
    oddEvenAnalysis: analyzeOddEven(historical, recent),
    highLowAnalysis: analyzeHighLow(historical, recent),
    consecutiveAnalysis: analyzeConsecutive(historical, recent),
    repeatAnalysis: analyzeRepeats(historical),
    digitSumAnalysis: analyzeDigitSums(historical),
    temporalPatterns: analyzeTemporalPatterns(historical),
    sequencePatterns: analyzeSequencePatterns(historical),
    numberRelationships: analyzeNumberRelationships(historical),
  };
}

// ---- Análisis de suma ----
function analyzeSumPatterns(all: LotteryDraw[], recent: LotteryDraw[]): SumPattern[] {
  const ranges: Record<string, { count: number; recentCount: number }> = {};

  all.forEach((d) => {
    const sum = d.mainNumbers.reduce((a, b) => a + b, 0);
    const range = getSumRange(sum);
    ranges[range] = { count: (ranges[range]?.count || 0) + 1, recentCount: ranges[range]?.recentCount || 0 };
  });

  recent.forEach((d) => {
    const sum = d.mainNumbers.reduce((a, b) => a + b, 0);
    const range = getSumRange(sum);
    ranges[range] = { count: ranges[range].count, recentCount: ranges[range].recentCount + 1 };
  });

  return Object.entries(ranges).map(([range, data]) => ({
    range,
    count: data.count,
    percentage: (data.count / all.length) * 100,
    isHot: data.recentCount / recent.length > data.count / all.length * 1.2,
  }));
}

// ---- Pares/Impares ----
function analyzeOddEven(all: LotteryDraw[], recent: LotteryDraw[]): {
  oddCount: number; evenCount: number; ratio: string; dominant: string;
} {
  let totalOdd = 0;
  let totalEven = 0;

  all.forEach((d) => {
    d.mainNumbers.forEach((n) => {
      if (n % 2 === 0) totalEven++;
      else totalOdd++;
    });
  });

  const total = totalOdd + totalEven;
  return {
    oddCount: totalOdd,
    evenCount: totalEven,
    ratio: `${(totalOdd / total * 100).toFixed(1)}% impares / ${(totalEven / total * 100).toFixed(1)}% pares`,
    dominant: totalOdd > totalEven ? "Impares" : "Pares",
  };
}

// ---- Alto/Bajo ----
function analyzeHighLow(all: LotteryDraw[], recent: LotteryDraw[]): {
  highCount: number; lowCount: number; ratio: string;
} {
  let totalHigh = 0;
  let totalLow = 0;

  all.forEach((d) => {
    d.mainNumbers.forEach((n) => {
      const max = d.lotteryId === "super-lotto" ? 45 : 56;
      if (n > max / 2) totalHigh++;
      else totalLow++;
    });
  });

  return {
    highCount: totalHigh,
    lowCount: totalLow,
    ratio: `${(totalLow / (totalHigh + totalLow) * 100).toFixed(1)}% bajos / ${(totalHigh / (totalHigh + totalLow) * 100).toFixed(1)}% altos`,
  };
}

// ---- Consecutivos ----
function analyzeConsecutive(all: LotteryDraw[], recent: LotteryDraw[]): {
  hasConsecutive: boolean; frequency: number; percentage: number;
} {
  let consecCount = 0;

  all.forEach((d) => {
    const sorted = [...d.mainNumbers].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] === 1) {
        consecCount++;
        break;
      }
    }
  });

  return {
    hasConsecutive: consecCount > all.length * 0.3,
    frequency: consecCount,
    percentage: (consecCount / all.length) * 100,
  };
}

// ---- Repetidos de sorteos anteriores ----
function analyzeRepeats(all: LotteryDraw[]): {
  fromLastDraw: number; fromLastTwo: number; percentage: number;
} {
  let fromLast = 0;
  let fromLastTwo = 0;

  for (let i = 0; i < all.length - 1; i++) {
    const current = new Set(all[i].mainNumbers);
    const last = new Set(all[i + 1].mainNumbers);
    const lastTwo = i + 2 < all.length ? new Set([...all[i + 1].mainNumbers, ...all[i + 2].mainNumbers]) : last;

    for (const n of current) {
      if (last.has(n)) fromLast++;
      if (lastTwo.has(n)) fromLastTwo++;
    }
  }

  return {
    fromLastDraw: fromLast,
    fromLastTwo: fromLastTwo,
    percentage: (fromLast / (all.length * 6)) * 100,
  };
}

// ---- Suma de dígitos ----
function analyzeDigitSums(all: LotteryDraw[]): { digitSumRange: string; frequency: number }[] {
  const ranges: Record<string, number> = {};

  all.forEach((d) => {
    d.mainNumbers.forEach((n) => {
      const ds = digitSum(n);
      let range: string;
      if (ds <= 5) range = "1-5";
      else if (ds <= 10) range = "6-10";
      else if (ds <= 15) range = "11-15";
      else range = "16+";
      ranges[range] = (ranges[range] || 0) + 1;
    });
  });

  return Object.entries(ranges).map(([range, freq]) => ({
    digitSumRange: range,
    frequency: freq,
  }));
}

// ---- Patrones temporales ----
function analyzeTemporalPatterns(draws: LotteryDraw[]): TemporalPattern[] {
  const patterns: TemporalPattern[] = [];

  // 1. Día de la semana
  const dayFreq: Record<string, number> = {};
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  draws.forEach((d) => {
    const date = new Date(d.drawDate);
    const day = dayNames[date.getDay()];
    dayFreq[day] = (dayFreq[day] || 0) + 1;
  });

  const maxDay = Object.entries(dayFreq).sort((a, b) => b[1] - a[1])[0];
  patterns.push({
    type: "Día de sorteo",
    description: `El día más frecuente es ${maxDay[0]} con ${(maxDay[1] / draws.length * 100).toFixed(1)}% de sorteos`,
    confidence: maxDay[1] / draws.length,
    data: dayFreq,
  });

  // 2. Mes del año
  const monthFreq: Record<string, number> = {};
  draws.forEach((d) => {
    const month = new Date(d.drawDate).getMonth() + 1;
    monthFreq[`${month}`] = (monthFreq[`${month}`] || 0) + 1;
  });

  const maxMonth = Object.entries(monthFreq).sort((a, b) => b[1] - a[1])[0];
  patterns.push({
    type: "Mes del sorteo",
    description: `El mes más frecuente es ${maxMonth[0]} con ${(maxMonth[1] / draws.length * 100).toFixed(1)}%`,
    confidence: maxMonth[1] / draws.length,
    data: monthFreq,
  });

  // 3. Números que aparecen en sorteos consecutivos
  const consecutiveRepeat: Record<number, number> = {};
  for (let i = 0; i < draws.length - 1; i++) {
    const current = new Set(draws[i].mainNumbers);
    for (const n of draws[i + 1].mainNumbers) {
      if (current.has(n)) {
        consecutiveRepeat[n] = (consecutiveRepeat[n] || 0) + 1;
      }
    }
  }

  const topRepeaters = Object.entries(consecutiveRepeat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  patterns.push({
    type: "Números repetidos consecutivos",
    description: `Los números que más se repiten entre sorteos consecutivos: ${topRepeaters.map(([n]) => n).join(", ")}`,
    confidence: 0.65,
    data: Object.fromEntries(topRepeaters),
  });

  // 4. Números "fríos" (no aparecen hace mucho)
  const lastSeen: Record<number, number> = {};
  draws.forEach((d, idx) => {
    d.mainNumbers.forEach((n) => {
      if (lastSeen[n] === undefined) lastSeen[n] = idx;
    });
  });

  const coldNumbers = Object.entries(lastSeen)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([n, idx]) => ({ number: Number(n), drawsAgo: idx }));

  patterns.push({
    type: "Números fríos (no aparecen hace tiempo)",
    description: `Números que no salen hace más sorteos: ${coldNumbers.map((c) => `${c.number} (${c.drawsAgo} sorteos)`).join(", ")}`,
    confidence: 0.60,
    data: Object.fromEntries(coldNumbers.map((c) => [c.number, c.drawsAgo])),
  });

  // 5. Patrón #sorteo → números ganadores
  const evenOddByDrawType: Record<string, { odd: number; even: number; count: number }> = {};
  draws.forEach((d) => {
    const drawNum = parseInt(d.drawNumber);
    const isEvenDraw = drawNum % 2 === 0;
    const key = isEvenDraw ? "Par" : "Impar";
    if (!evenOddByDrawType[key]) evenOddByDrawType[key] = { odd: 0, even: 0, count: 0 };
    d.mainNumbers.forEach((n) => {
      if (n % 2 === 0) evenOddByDrawType[key].even++;
      else evenOddByDrawType[key].odd++;
    });
    evenOddByDrawType[key].count++;
  });

  // Convertir a formato plano para el tipo TemporalPattern
  const flatData: Record<string, number> = {};
  Object.entries(evenOddByDrawType).forEach(([key, val]) => {
    flatData[`${key}_odd`] = val.odd;
    flatData[`${key}_even`] = val.even;
    flatData[`${key}_count`] = val.count;
  });

  patterns.push({
    type: "Patrón #sorteo par/impar",
    description: `Sorteos pares tienden a más ${evenOddByDrawType["Par"]?.even > evenOddByDrawType["Impar"]?.even ? "números pares" : "números impares"}`,
    confidence: 0.55,
    data: flatData,
  });

  return patterns;
}

// ---- Patrones de secuencia (entre sorteos) ----
function analyzeSequencePatterns(draws: LotteryDraw[]): SequencePattern[] {
  const patterns: SequencePattern[] = [];

  // 1. Números que suben de frecuencia
  const recent = draws.slice(0, 30);
  const older = draws.slice(30, 90);

  const freqRecent: Record<number, number> = {};
  const freqOlder: Record<number, number> = {};

  recent.forEach((d) => d.mainNumbers.forEach((n) => { freqRecent[n] = (freqRecent[n] || 0) + 1; }));
  older.forEach((d) => d.mainNumbers.forEach((n) => { freqOlder[n] = (freqOlder[n] || 0) + 1; }));

  const rising = Object.entries(freqRecent)
    .filter(([n]) => {
      const recentFreq = freqRecent[Number(n)] / 30;
      const olderFreq = (freqOlder[Number(n)] || 0) / 60;
      return recentFreq > olderFreq * 1.3 && recentFreq > 0.1;
    })
    .map(([n]) => Number(n));

  patterns.push({
    pattern: "Subiendo",
    frequency: rising.length,
    description: `Números en tendencia ascendente: ${rising.slice(0, 8).join(", ")}`,
  });

  // 2. Números que bajan
  const falling = Object.entries(freqOlder)
    .filter(([n]) => {
      const recentFreq = (freqRecent[Number(n)] || 0) / 30;
      const olderFreq = freqOlder[Number(n)] / 60;
      return olderFreq > recentFreq * 1.3 && olderFreq > 0.1;
    })
    .map(([n]) => Number(n));

  patterns.push({
    pattern: "Bajando",
    frequency: falling.length,
    description: `Números en tendencia descendente: ${falling.slice(0, 8).join(", ")}`,
  });

  // 3. Números estables (siempre aparecen)
  const stable = Object.entries(freqRecent)
    .filter(([n]) => {
      const f = freqRecent[Number(n)] / 30;
      return f > 0.08 && f < 0.2;
    })
    .map(([n]) => Number(n));

  patterns.push({
    pattern: "Estables",
    frequency: stable.length,
    description: `Números con frecuencia estable: ${stable.slice(0, 8).join(", ")}`,
  });

  return patterns;
}

// ---- Relaciones numéricas ----
function analyzeNumberRelationships(draws: LotteryDraw[]): {
  primeCount: number; fibonacciCount: number; compositeCount: number;
} {
  let primes = 0;
  let fibs = 0;
  let composites = 0;

  draws.forEach((d) => {
    d.mainNumbers.forEach((n) => {
      if (isPrime(n)) primes++;
      else if (isFibonacci(n)) fibs++;
      else composites++;
    });
  });

  return {
    primeCount: primes,
    fibonacciCount: fibs,
    compositeCount: composites,
  };
}
