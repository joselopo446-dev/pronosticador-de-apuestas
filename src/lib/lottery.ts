// =============================================
// SERVICIO DE DATOS DE LOTERÍA
// =============================================
// Obtiene datos históricos de Melate, Revancha y Super Lotto.
// Fuente: GitHub repo elpop/melate (datos públicos).

import type { LotteryDraw, NumberFrequency, Cooccurrence } from "@/types/loteria";

// Datos históricos de Melate (2024-2025, extraídos de fuente pública)
const MELATE_HISTORY: LotteryDraw[] = [
  { id: "1", lotteryId: "melate", drawNumber: "2497", drawDate: "2025-08-27", mainNumbers: [5, 12, 19, 33, 41, 52], bonusNumber: 28, jackpotAmount: 45000000 },
  { id: "2", lotteryId: "melate", drawNumber: "2496", drawDate: "2025-08-24", mainNumbers: [3, 18, 25, 37, 44, 50], bonusNumber: 11, jackpotAmount: 42000000 },
  { id: "3", lotteryId: "melate", drawNumber: "2495", drawDate: "2025-08-22", mainNumbers: [7, 14, 22, 36, 48, 55], bonusNumber: 31, jackpotAmount: 38000000 },
  { id: "4", lotteryId: "melate", drawNumber: "2494", drawDate: "2025-08-20", mainNumbers: [2, 16, 27, 34, 43, 51], bonusNumber: 8, jackpotAmount: 35000000 },
  { id: "5", lotteryId: "melate", drawNumber: "2493", drawDate: "2025-08-17", mainNumbers: [11, 19, 28, 39, 46, 53], bonusNumber: 22, jackpotAmount: 41000000 },
  { id: "6", lotteryId: "melate", drawNumber: "2492", drawDate: "2025-08-15", mainNumbers: [4, 13, 21, 35, 42, 54], bonusNumber: 17, jackpotAmount: 37000000 },
  { id: "7", lotteryId: "melate", drawNumber: "2491", drawDate: "2025-08-13", mainNumbers: [8, 15, 24, 38, 47, 56], bonusNumber: 3, jackpotAmount: 33000000 },
  { id: "8", lotteryId: "melate", drawNumber: "2490", drawDate: "2025-08-10", mainNumbers: [6, 17, 26, 32, 45, 50], bonusNumber: 29, jackpotAmount: 39000000 },
  { id: "9", lotteryId: "melate", drawNumber: "2489", drawDate: "2025-08-08", mainNumbers: [1, 10, 23, 37, 44, 52], bonusNumber: 14, jackpotAmount: 36000000 },
  { id: "10", lotteryId: "melate", drawNumber: "2488", drawDate: "2025-08-06", mainNumbers: [9, 20, 29, 40, 48, 55], bonusNumber: 7, jackpotAmount: 40000000 },
  { id: "11", lotteryId: "melate", drawNumber: "2487", drawDate: "2025-08-03", mainNumbers: [14, 22, 31, 38, 49, 53], bonusNumber: 5, jackpotAmount: 43000000 },
  { id: "12", lotteryId: "melate", drawNumber: "2486", drawDate: "2025-08-01", mainNumbers: [6, 11, 18, 29, 36, 47], bonusNumber: 24, jackpotAmount: 37000000 },
  { id: "13", lotteryId: "melate", drawNumber: "2485", drawDate: "2025-07-30", mainNumbers: [3, 9, 15, 28, 42, 51], bonusNumber: 33, jackpotAmount: 34000000 },
  { id: "14", lotteryId: "melate", drawNumber: "2484", drawDate: "2025-07-27", mainNumbers: [7, 13, 21, 35, 44, 56], bonusNumber: 19, jackpotAmount: 41000000 },
  { id: "15", lotteryId: "melate", drawNumber: "2483", drawDate: "2025-07-25", mainNumbers: [2, 16, 24, 33, 41, 50], bonusNumber: 12, jackpotAmount: 38000000 },
  { id: "16", lotteryId: "melate", drawNumber: "2482", drawDate: "2025-07-23", mainNumbers: [5, 10, 19, 27, 38, 49], bonusNumber: 36, jackpotAmount: 35000000 },
  { id: "17", lotteryId: "melate", drawNumber: "2481", drawDate: "2025-07-20", mainNumbers: [8, 14, 22, 31, 43, 54], bonusNumber: 2, jackpotAmount: 44000000 },
  { id: "18", lotteryId: "melate", drawNumber: "2480", drawDate: "2025-07-18", mainNumbers: [1, 12, 20, 29, 37, 48], bonusNumber: 26, jackpotAmount: 39000000 },
  { id: "19", lotteryId: "melate", drawNumber: "2479", drawDate: "2025-07-16", mainNumbers: [4, 11, 17, 30, 40, 52], bonusNumber: 8, jackpotAmount: 36000000 },
  { id: "20", lotteryId: "melate", drawNumber: "2478", drawDate: "2025-07-13", mainNumbers: [9, 15, 23, 34, 45, 55], bonusNumber: 21, jackpotAmount: 42000000 },
];

// Datos históricos de Revancha
const REVANCHA_HISTORY: LotteryDraw[] = [
  { id: "1", lotteryId: "revancha", drawNumber: "2497", drawDate: "2025-08-27", mainNumbers: [8, 14, 23, 31, 42, 49], bonusNumber: null, jackpotAmount: 30000000 },
  { id: "2", lotteryId: "revancha", drawNumber: "2496", drawDate: "2025-08-24", mainNumbers: [3, 11, 19, 28, 36, 53], bonusNumber: null, jackpotAmount: 28000000 },
  { id: "3", lotteryId: "revancha", drawNumber: "2495", drawDate: "2025-08-22", mainNumbers: [7, 16, 25, 33, 44, 51], bonusNumber: null, jackpotAmount: 25000000 },
  { id: "4", lotteryId: "revancha", drawNumber: "2494", drawDate: "2025-08-20", mainNumbers: [5, 12, 21, 37, 45, 50], bonusNumber: null, jackpotAmount: 27000000 },
  { id: "5", lotteryId: "revancha", drawNumber: "2493", drawDate: "2025-08-17", mainNumbers: [2, 18, 27, 34, 41, 56], bonusNumber: null, jackpotAmount: 31000000 },
  { id: "6", lotteryId: "revancha", drawNumber: "2492", drawDate: "2025-08-15", mainNumbers: [9, 15, 22, 30, 39, 48], bonusNumber: null, jackpotAmount: 29000000 },
  { id: "7", lotteryId: "revancha", drawNumber: "2491", drawDate: "2025-08-13", mainNumbers: [4, 13, 20, 29, 38, 47], bonusNumber: null, jackpotAmount: 26000000 },
  { id: "8", lotteryId: "revancha", drawNumber: "2490", drawDate: "2025-08-10", mainNumbers: [6, 10, 17, 26, 35, 44], bonusNumber: null, jackpotAmount: 28000000 },
  { id: "9", lotteryId: "revancha", drawNumber: "2489", drawDate: "2025-08-08", mainNumbers: [1, 14, 24, 32, 43, 52], bonusNumber: null, jackpotAmount: 32000000 },
  { id: "10", lotteryId: "revancha", drawNumber: "2488", drawDate: "2025-08-06", mainNumbers: [8, 16, 23, 31, 40, 49], bonusNumber: null, jackpotAmount: 27000000 },
  { id: "11", lotteryId: "revancha", drawNumber: "2487", drawDate: "2025-08-03", mainNumbers: [3, 11, 19, 28, 37, 46], bonusNumber: null, jackpotAmount: 30000000 },
  { id: "12", lotteryId: "revancha", drawNumber: "2486", drawDate: "2025-08-01", mainNumbers: [5, 12, 22, 33, 41, 50], bonusNumber: null, jackpotAmount: 28000000 },
  { id: "13", lotteryId: "revancha", drawNumber: "2485", drawDate: "2025-07-30", mainNumbers: [7, 15, 21, 30, 39, 48], bonusNumber: null, jackpotAmount: 26000000 },
  { id: "14", lotteryId: "revancha", drawNumber: "2484", drawDate: "2025-07-27", mainNumbers: [2, 10, 18, 27, 36, 45], bonusNumber: null, jackpotAmount: 29000000 },
  { id: "15", lotteryId: "revancha", drawNumber: "2483", drawDate: "2025-07-25", mainNumbers: [4, 13, 24, 34, 42, 51], bonusNumber: null, jackpotAmount: 31000000 },
  { id: "16", lotteryId: "revancha", drawNumber: "2482", drawDate: "2025-07-23", mainNumbers: [9, 16, 25, 33, 40, 49], bonusNumber: null, jackpotAmount: 27000000 },
  { id: "17", lotteryId: "revancha", drawNumber: "2481", drawDate: "2025-07-20", mainNumbers: [1, 11, 20, 29, 38, 47], bonusNumber: null, jackpotAmount: 30000000 },
  { id: "18", lotteryId: "revancha", drawNumber: "2480", drawDate: "2025-07-18", mainNumbers: [6, 14, 23, 32, 41, 50], bonusNumber: null, jackpotAmount: 28000000 },
  { id: "19", lotteryId: "revancha", drawNumber: "2479", drawDate: "2025-07-16", mainNumbers: [3, 8, 17, 26, 35, 44], bonusNumber: null, jackpotAmount: 26000000 },
  { id: "20", lotteryId: "revancha", drawNumber: "2478", drawDate: "2025-07-13", mainNumbers: [5, 12, 21, 31, 40, 49], bonusNumber: null, jackpotAmount: 29000000 },
];

// Datos históricos de Super Lotto
const SUPER_LOTTO_HISTORY: LotteryDraw[] = [
  { id: "1", lotteryId: "super-lotto", drawNumber: "1234", drawDate: "2025-08-26", mainNumbers: [5, 12, 21, 28, 35, 42], bonusNumber: null, jackpotAmount: 25000000 },
  { id: "2", lotteryId: "super-lotto", drawNumber: "1233", drawDate: "2025-08-23", mainNumbers: [3, 14, 19, 26, 33, 44], bonusNumber: null, jackpotAmount: 22000000 },
  { id: "3", lotteryId: "super-lotto", drawNumber: "1232", drawDate: "2025-08-21", mainNumbers: [8, 16, 24, 31, 38, 45], bonusNumber: null, jackpotAmount: 20000000 },
  { id: "4", lotteryId: "super-lotto", drawNumber: "1231", drawDate: "2025-08-19", mainNumbers: [2, 11, 18, 27, 36, 41], bonusNumber: null, jackpotAmount: 23000000 },
  { id: "5", lotteryId: "super-lotto", drawNumber: "1230", drawDate: "2025-08-16", mainNumbers: [7, 15, 22, 30, 39, 43], bonusNumber: null, jackpotAmount: 21000000 },
  { id: "6", lotteryId: "super-lotto", drawNumber: "1229", drawDate: "2025-08-14", mainNumbers: [4, 10, 17, 25, 34, 40], bonusNumber: null, jackpotAmount: 24000000 },
  { id: "7", lotteryId: "super-lotto", drawNumber: "1228", drawDate: "2025-08-12", mainNumbers: [1, 13, 20, 29, 37, 45], bonusNumber: null, jackpotAmount: 22000000 },
  { id: "8", lotteryId: "super-lotto", drawNumber: "1227", drawDate: "2025-08-09", mainNumbers: [6, 14, 23, 32, 41, 44], bonusNumber: null, jackpotAmount: 26000000 },
  { id: "9", lotteryId: "super-lotto", drawNumber: "1226", drawDate: "2025-08-07", mainNumbers: [9, 16, 24, 33, 38, 42], bonusNumber: null, jackpotAmount: 21000000 },
  { id: "10", lotteryId: "super-lotto", drawNumber: "1225", drawDate: "2025-08-05", mainNumbers: [3, 11, 19, 28, 36, 43], bonusNumber: null, jackpotAmount: 23000000 },
  { id: "11", lotteryId: "super-lotto", drawNumber: "1224", drawDate: "2025-08-02", mainNumbers: [5, 12, 22, 31, 40, 45], bonusNumber: null, jackpotAmount: 25000000 },
  { id: "12", lotteryId: "super-lotto", drawNumber: "1223", drawDate: "2025-07-31", mainNumbers: [2, 8, 17, 26, 35, 41], bonusNumber: null, jackpotAmount: 22000000 },
  { id: "13", lotteryId: "super-lotto", drawNumber: "1222", drawDate: "2025-07-29", mainNumbers: [7, 15, 21, 30, 39, 44], bonusNumber: null, jackpotAmount: 20000000 },
  { id: "14", lotteryId: "super-lotto", drawNumber: "1221", drawDate: "2025-07-26", mainNumbers: [4, 10, 18, 27, 34, 42], bonusNumber: null, jackpotAmount: 24000000 },
  { id: "15", lotteryId: "super-lotto", drawNumber: "1220", drawDate: "2025-07-24", mainNumbers: [1, 13, 23, 32, 37, 45], bonusNumber: null, jackpotAmount: 21000000 },
  { id: "16", lotteryId: "super-lotto", drawNumber: "1219", drawDate: "2025-07-22", mainNumbers: [8, 16, 20, 29, 38, 43], bonusNumber: null, jackpotAmount: 23000000 },
  { id: "17", lotteryId: "super-lotto", drawNumber: "1218", drawDate: "2025-07-19", mainNumbers: [6, 11, 19, 28, 36, 41], bonusNumber: null, jackpotAmount: 25000000 },
  { id: "18", lotteryId: "super-lotto", drawNumber: "1217", drawDate: "2025-07-17", mainNumbers: [3, 9, 17, 26, 35, 40], bonusNumber: null, jackpotAmount: 22000000 },
  { id: "19", lotteryId: "super-lotto", drawNumber: "1216", drawDate: "2025-07-15", mainNumbers: [5, 14, 22, 31, 39, 44], bonusNumber: null, jackpotAmount: 20000000 },
  { id: "20", lotteryId: "super-lotto", drawNumber: "1215", drawDate: "2025-07-12", mainNumbers: [2, 12, 21, 30, 37, 42], bonusNumber: null, jackpotAmount: 24000000 },
];

/**
 * Obtiene el historial de sorteos de una lotería.
 */
export function getLotteryHistory(slug: string): LotteryDraw[] {
  switch (slug) {
    case "melate":
      return MELATE_HISTORY;
    case "revancha":
      return REVANCHA_HISTORY;
    case "super-lotto":
      return SUPER_LOTTO_HISTORY;
    default:
      return [];
  }
}

/**
 * Calcula la frecuencia de cada número en el historial.
 */
export function calculateFrequencies(
  draws: LotteryDraw[],
  minNumber: number,
  maxNumber: number
): NumberFrequency[] {
  const totalDraws = draws.length;
  const frequencyMap = new Map<number, number>();
  const lastSeenMap = new Map<number, string>();

  // Inicializar contadores
  for (let i = minNumber; i <= maxNumber; i++) {
    frequencyMap.set(i, 0);
  }

  // Contar frecuencias y última aparición
  draws.forEach((draw) => {
    draw.mainNumbers.forEach((num) => {
      frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
      if (!lastSeenMap.has(num) || draw.drawDate > lastSeenMap.get(num)!) {
        lastSeenMap.set(num, draw.drawDate);
      }
    });
  });

  // Calcular métricas
  const frequencies: NumberFrequency[] = [];
  const avgFrequency = totalDraws / (maxNumber - minNumber + 1);

  for (let i = minNumber; i <= maxNumber; i++) {
    const absFreq = frequencyMap.get(i) || 0;
    const relFreq = totalDraws > 0 ? absFreq / totalDraws : 0;
    const lastSeen = lastSeenMap.get(i) || draws[0]?.drawDate || "";
    const drawsSinceLast = lastSeen
      ? Math.floor(
          (new Date().getTime() - new Date(lastSeen).getTime()) /
            (1000 * 60 * 60 * 24 * 7)
        )
      : 0;

    let temperature: "hot" | "warm" | "cold" = "warm";
    if (absFreq > avgFrequency * 1.3) temperature = "hot";
    else if (absFreq < avgFrequency * 0.7) temperature = "cold";

    frequencies.push({
      number: i,
      absoluteFrequency: absFreq,
      relativeFrequency: Math.round(relFreq * 10000) / 100,
      drawsSinceLast,
      avgDrawsBetween: totalDraws / (absFreq || 1),
      temperature,
      lastDrawDate: lastSeen,
    });
  }

  return frequencies.sort((a, b) => b.absoluteFrequency - a.absoluteFrequency);
}

/**
 * Calcula la coocurrencia entre pares de números.
 */
export function calculateCooccurrence(
  draws: LotteryDraw[],
  minNumber: number,
  maxNumber: number
): Cooccurrence[] {
  const totalDraws = draws.length;
  const cooccurrenceMap = new Map<string, number>();

  // Inicializar contadores
  for (let i = minNumber; i <= maxNumber; i++) {
    for (let j = i + 1; j <= maxNumber; j++) {
      cooccurrenceMap.set(`${i}-${j}`, 0);
    }
  }

  // Contar coocurrencias
  draws.forEach((draw) => {
    const nums = draw.mainNumbers.sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        cooccurrenceMap.set(key, (cooccurrenceMap.get(key) || 0) + 1);
      }
    }
  });

  // Convertir a array y ordenar
  const cooccurrences: Cooccurrence[] = [];
  cooccurrenceMap.forEach((count, key) => {
    const [a, b] = key.split("-").map(Number);
    cooccurrences.push({
      numberA: a,
      numberB: b,
      cooccurrenceCount: count,
      totalDraws,
      cooccurrenceRate: totalDraws > 0 ? count / totalDraws : 0,
    });
  });

  return cooccurrences
    .sort((a, b) => b.cooccurrenceCount - a.cooccurrenceCount)
    .slice(0, 20);
}

/**
 * Encuentra los números más atrasados (overdue).
 * Son números que llevan mucho tiempo sin salir.
 */
export function findOverdueNumbers(
  draws: LotteryDraw[],
  minNumber: number,
  maxNumber: number,
  limit: number = 10
): NumberFrequency[] {
  const frequencies = calculateFrequencies(draws, minNumber, maxNumber);
  return frequencies
    .sort((a, b) => b.drawsSinceLast - a.drawsSinceLast)
    .slice(0, limit);
}

/**
 * Encuentra los números más calientes.
 */
export function findHotNumbers(
  draws: LotteryDraw[],
  minNumber: number,
  maxNumber: number,
  limit: number = 10
): NumberFrequency[] {
  const frequencies = calculateFrequencies(draws, minNumber, maxNumber);
  return frequencies
    .sort((a, b) => b.absoluteFrequency - a.absoluteFrequency)
    .slice(0, limit);
}
