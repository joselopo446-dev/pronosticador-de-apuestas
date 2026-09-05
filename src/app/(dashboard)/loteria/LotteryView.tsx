// =============================================
// COMPONENTE COMPARTIDO — VISTA DE LOTERÍA
// =============================================
// Muestra análisis estadístico de una lotería específica.

"use client";

import { useState, useMemo, useEffect } from "react";
import type { LotteryDraw, NumberFrequency, Cooccurrence } from "@/types/loteria";
import {
  calculateFrequencies,
  calculateCooccurrence,
  findHotNumbers,
  findOverdueNumbers,
  generateNumbers,
  type GeneratedCombination,
} from "@/lib/lottery";
import { analyzePatterns, type PatternAnalysis } from "@/lib/lottery-patterns";
import { runBacktest, type BacktestSummary } from "@/lib/lottery-backtest";

interface LotteryViewProps {
  name: string;
  slug: string;
  color: "purple" | "pink" | "yellow";
  minNumber: number;
  maxNumber: number;
  numbersCount: number;
  draws: LotteryDraw[];
}

const colorClasses = {
  purple: {
    badge: "bg-purple-600",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  pink: {
    badge: "bg-pink-600",
    text: "text-pink-400",
    border: "border-pink-500/30",
  },
  yellow: {
    badge: "bg-yellow-600",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
};

export default function LotteryView({
  name,
  slug,
  color,
  minNumber,
  maxNumber,
  numbersCount,
  draws,
}: LotteryViewProps) {
  const [activeTab, setActiveTab] = useState<"frecuencias" | "calientes" | "atrasados" | "coocurrencia" | "patrones" | "backtest" | "temporal" | "generar">("frecuencias");
  const [generated, setGenerated] = useState<GeneratedCombination | null>(null);
  const [genStrategy, setGenStrategy] = useState<"frecuencia" | "atrasados" | "mixto" | "aleatorio">("mixto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [patterns, setPatterns] = useState<PatternAnalysis | null>(null);
  const [backtest, setBacktest] = useState<BacktestSummary | null>(null);
  const [activePatternTab, setActivePatternTab] = useState<"suma" | "parimpar" | "relaciones" | "secuencia">("suma");
  const [predictionStats, setPredictionStats] = useState<{
    hotNumbers: number[];
    coldNumbers: number[];
    overdueNumbers: number[];
    avgSum: number;
    trend: string;
  } | null>(null);
  const colors = colorClasses[color];

  const frequencies = useMemo(
    () => calculateFrequencies(draws, minNumber, maxNumber),
    [draws, minNumber, maxNumber]
  );

  const hotNumbers = useMemo(
    () => findHotNumbers(draws, minNumber, maxNumber, 10),
    [draws, minNumber, maxNumber]
  );

  const overdueNumbers = useMemo(
    () => findOverdueNumbers(draws, minNumber, maxNumber, 10),
    [draws, minNumber, maxNumber]
  );

  const cooccurrences = useMemo(
    () => calculateCooccurrence(draws, minNumber, maxNumber),
    [draws, minNumber, maxNumber]
  );

  // Calcular patrones cuando se selecciona la pestaña
  useEffect(() => {
    if (activeTab === "patrones" && !patterns) {
      setPatterns(analyzePatterns(draws, 30));
    }
  }, [activeTab, patterns, draws]);

  // Calcular backtest cuando se selecciona la pestaña
  useEffect(() => {
    if (activeTab === "backtest" && !backtest) {
      setBacktest(runBacktest(draws, maxNumber, slug));
    }
  }, [activeTab, backtest, draws, maxNumber, slug]);

  function handleGenerate() {
    setIsGenerating(true);
    setTimeout(async () => {
      try {
        // Usar el nuevo predictor mejorado
        const { generatePrediction } = await import("@/lib/lottery-predictor");
        
        const strategyMap: Record<string, string> = {
          "frecuencia": "hot-cold",
          "atrasados": "overdue",
          "mixto": "ensemble",
          "aleatorio": "ml",
        };
        
        const result = generatePrediction(slug, strategyMap[genStrategy] || "ensemble", draws);
        
        // Convertir al formato esperado
        const generatedCombo: GeneratedCombination = {
          numbers: result.numbers,
          strategy: result.strategies[0] || genStrategy,
          confidence: result.confidence,
          reasons: result.factors.map((f) => `${f.name}: ${f.value} — ${f.description}`),
        };
        
        setGenerated(generatedCombo);
        setPredictionStats(result.statistics);
      } catch {
        // Fallback al generador anterior
        const result = generateNumbers(draws, minNumber, maxNumber, numbersCount, genStrategy);
        setGenerated(result);
      }
      setIsGenerating(false);
    }, 500);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 ${colors.badge} rounded-full flex items-center justify-center`}>
          <span className="text-white font-bold text-xl">{name[0]}</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{name}</h1>
          <p className="text-gray-400">
            {numbersCount} números del {minNumber}-{maxNumber} — {draws.length} sorteos analizados
          </p>
        </div>
      </div>

      {/* Último sorteo */}
      {draws.length > 0 && (
        <div className={`bg-gray-800 border ${colors.border} rounded-xl p-6`}>
          <h2 className={`text-lg font-semibold ${colors.text} mb-4`}>
            Último Sorteo — {draws[0].drawNumber}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {new Date(draws[0].drawDate + "T12:00:00").toLocaleDateString("es-MX", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex gap-3 mt-4">
            {draws[0].mainNumbers.map((num, i) => (
              <div
                key={i}
                className={`w-12 h-12 ${colors.badge} rounded-full flex items-center justify-center`}
              >
                <span className="text-white font-bold">{num}</span>
              </div>
            ))}
            {draws[0].bonusNumber && (
              <>
                <div className="w-6 h-12 flex items-center justify-center text-gray-500">+</div>
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{draws[0].bonusNumber}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs de análisis */}
      <div className="flex gap-2 border-b border-gray-700 pb-2 flex-wrap">
        {(["frecuencias", "calientes", "atrasados", "coocurrencia", "patrones", "backtest", "temporal", "generar"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? `${colors.badge} text-white`
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            {tab === "frecuencias" && "Frecuencias"}
            {tab === "calientes" && "Calientes"}
            {tab === "atrasados" && "Atrasados"}
            {tab === "coocurrencia" && "Coocurrencia"}
            {tab === "patrones" && "Patrones"}
            {tab === "backtest" && "Backtest"}
            {tab === "temporal" && "Temporal"}
            {tab === "generar" && "Generar"}
          </button>
        ))}
      </div>

      {/* Contenido de tabs */}
      {activeTab === "frecuencias" && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>
            Frecuencia de Números (Top 20)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {frequencies.slice(0, 20).map((freq) => (
              <div
                key={freq.number}
                className="p-3 bg-gray-700/50 rounded-lg text-center"
              >
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {freq.number}
                </div>
                <div className="text-sm text-gray-400">
                  {freq.absoluteFrequency} veces
                </div>
                <div className="text-xs text-gray-500">
                  {freq.relativeFrequency.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "calientes" && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4">
            🔥 Números Calientes (Más frecuentes)
          </h3>
          <div className="space-y-3">
            {hotNumbers.map((freq, i) => (
              <div
                key={freq.number}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-6">{i + 1}.</span>
                  <div className={`w-10 h-10 ${colors.badge} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold">{freq.number}</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Número {freq.number}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      {freq.absoluteFrequency} apariciones
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-red-400">
                    {freq.relativeFrequency.toFixed(1)}% frecuencia
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "atrasados" && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">
            ❄️ Números Atrasados (Overdue)
          </h3>
          <div className="space-y-3">
            {overdueNumbers.map((freq, i) => (
              <div
                key={freq.number}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-6">{i + 1}.</span>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{freq.number}</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Número {freq.number}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      {freq.absoluteFrequency} apariciones
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-400">
                    {freq.drawsSinceLast} sorteos sin salir
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "coocurrencia" && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">
            🔗 Pares que Más Salen Juntos
          </h3>
          <div className="space-y-3">
            {cooccurrences.slice(0, 10).map((co, i) => (
              <div
                key={`${co.numberA}-${co.numberB}`}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-6">{i + 1}.</span>
                  <div className="flex gap-2">
                    <div className={`w-10 h-10 ${colors.badge} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold">{co.numberA}</span>
                    </div>
                    <div className={`w-10 h-10 ${colors.badge} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold">{co.numberB}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">
                    {co.cooccurrenceCount} veces juntos
                  </div>
                  <div className="text-xs text-gray-400">
                    {(co.cooccurrenceRate * 100).toFixed(1)}% de sorteos
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Patrones */}
      {activeTab === "patrones" && patterns && (
        <div className="space-y-6">
          {/* Sub-tabs de patrones */}
          <div className="flex gap-2">
            {(["suma", "parimpar", "relaciones", "secuencia"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePatternTab(tab)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  activePatternTab === tab
                    ? `${colors.badge} text-white`
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab === "suma" && "Suma"}
                {tab === "parimpar" && "Par/Impar"}
                {tab === "relaciones" && "Relaciones"}
                {tab === "secuencia" && "Secuencia"}
              </button>
            ))}
          </div>

          {/* Suma */}
          {activePatternTab === "suma" && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>
                Análisis de Suma de Números
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Rangos de suma más frecuentes en los {draws.length} sorteos.
              </p>
              <div className="space-y-3">
                {patterns.sumAnalysis.map((s) => (
                  <div key={s.range} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div>
                      <span className="text-white font-medium">{s.range}</span>
                      <span className="text-gray-400 text-sm ml-2">({s.count} sorteos)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${s.isHot ? "bg-red-500" : "bg-blue-500"}`}
                          style={{ width: `${s.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-white w-12 text-right">{s.percentage.toFixed(1)}%</span>
                      {s.isHot && <span className="text-xs bg-red-600/30 text-red-400 px-2 py-0.5 rounded"> caliente</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Par/Impar */}
          {activePatternTab === "parimpar" && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>
                Distribución Par/Impar
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-400">{patterns.oddEvenAnalysis.oddCount}</p>
                  <p className="text-gray-400">Impares</p>
                </div>
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-400">{patterns.oddEvenAnalysis.evenCount}</p>
                  <p className="text-gray-400">Pares</p>
                </div>
              </div>
              <p className="text-center text-gray-400 mt-4">{patterns.oddEvenAnalysis.ratio}</p>
              <p className="text-center text-white mt-2">Dominante: <span className={`font-bold ${colors.text}`}>{patterns.oddEvenAnalysis.dominant}</span></p>
            </div>
          )}

          {/* Relaciones numéricas */}
          {activePatternTab === "relaciones" && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>
                Relaciones Numéricas
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-3xl font-bold text-green-400">{patterns.numberRelationships.primeCount}</p>
                  <p className="text-gray-400">Primos</p>
                </div>
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-400">{patterns.numberRelationships.fibonacciCount}</p>
                  <p className="text-gray-400">Fibonacci</p>
                </div>
                <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-400">{patterns.numberRelationships.compositeCount}</p>
                  <p className="text-gray-400">Compuestos</p>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-white font-medium mb-2">Análisis de Dígitos</h4>
                <div className="space-y-2">
                  {patterns.digitSumAnalysis.map((d) => (
                    <div key={d.digitSumRange} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                      <span className="text-gray-400">Suma de dígitos {d.digitSumRange}</span>
                      <span className="text-white">{d.frequency} apariciones</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Secuencia */}
          {activePatternTab === "secuencia" && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>
                Patrones de Secuencia
              </h3>
              <div className="space-y-4">
                {patterns.sequencePatterns.map((p) => (
                  <div key={p.pattern} className="p-4 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">Tendencia: {p.pattern}</span>
                      <span className="text-gray-400 text-sm">{p.frequency} números</span>
                    </div>
                    <p className="text-sm text-gray-400">{p.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
                <h4 className="text-white font-medium mb-2">Patrones Consecutivos</h4>
                <p className="text-gray-400 text-sm">
                  {patterns.consecutiveAnalysis.percentage.toFixed(1)}% de sorteos tienen números consecutivos.
                  {patterns.consecutiveAnalysis.hasConsecutive ? " Es común encontrar consecutivos." : " No es muy común."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Backtest */}
      {activeTab === "backtest" && backtest && (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className={`text-lg font-semibold ${colors.text} mb-2`}>
              Backtest de Estrategias
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Prueba cada estrategia en los últimos 50 sorteos para ver cuál funciona mejor.
            </p>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
              <p className="text-yellow-400 text-sm font-medium">{backtest.overallVerdict}</p>
            </div>
          </div>

          {backtest.results.map((r) => (
            <div key={r.strategyName} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-medium text-lg">{r.strategyName}</h4>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  r.roi > 0 ? "bg-green-600/30 text-green-400" : "bg-red-600/30 text-red-400"
                }`}>
                  ROI: {r.roi.toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                {[
                  { label: "3 aciertos", actual: r.matches.three, expected: r.expectedThree, color: "blue" },
                  { label: "4 aciertos", actual: r.matches.four, expected: r.expectedFour, color: "yellow" },
                  { label: "5 aciertos", actual: r.matches.five, expected: r.expectedFive, color: "purple" },
                  { label: "6 aciertos", actual: r.matches.six, expected: r.expectedSix, color: "green" },
                ].map((m) => (
                  <div key={m.label} className="text-center p-3 bg-gray-700/50 rounded-lg">
                    <p className={`text-2xl font-bold text-${m.color}-400`}>{m.actual}</p>
                    <p className="text-xs text-gray-400">{m.label}</p>
                    <p className="text-xs text-gray-500">Esperado: {m.expected.toFixed(1)}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-gray-700/30 rounded-lg">
                <p className="text-sm text-gray-400">{r.verdict}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Temporal */}
      {activeTab === "temporal" && patterns && (
        <div className="space-y-6">
          {patterns.temporalPatterns.map((p) => (
            <div key={p.type} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className={`text-lg font-semibold ${colors.text} mb-2`}>{p.type}</h3>
              <p className="text-gray-400 text-sm mb-4">{p.description}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-400">Confianza:</span>
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${p.confidence > 0.6 ? "bg-green-500" : "bg-yellow-500"}`}
                    style={{ width: `${p.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm text-white">{(p.confidence * 100).toFixed(0)}%</span>
              </div>
              {Object.keys(p.data).length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(p.data)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([key, val]) => (
                      <div key={key} className="p-2 bg-gray-700/30 rounded text-sm">
                        <span className="text-gray-400">{key}:</span>
                        <span className="text-white ml-1">{val}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "generar" && (
        <div className="space-y-6">
          {/* Selector de estrategia */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className={`text-lg font-semibold ${colors.text} mb-4`}>
              Generar Números Posibles Ganadores
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Selecciona una estrategia y genera una combinación basada en el análisis estadístico de los {draws.length} sorteos analizados.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { id: "mixto" as const, name: "Mixto (Recomendado)", desc: "Combina números calientes + atrasados", icon: "🎯" },
                { id: "frecuencia" as const, name: "Frecuencia", desc: "Números que más salen", icon: "🔥" },
                { id: "atrasados" as const, name: "Atrasados", desc: "Números que deben salir", icon: "❄️" },
                { id: "aleatorio" as const, name: "Aleatorio", desc: "Selección al azar", icon: "🎲" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setGenStrategy(s.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    genStrategy === s.id
                      ? `bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/50`
                      : "bg-gray-700/50 border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-sm font-medium text-white mt-2">{s.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`px-6 py-3 ${colors.badge} text-white rounded-lg hover:opacity-90 transition-all font-medium disabled:opacity-50`}
            >
              {isGenerating ? "Generando..." : "Generar Combinación"}
            </button>
          </div>

          {/* Resultado generado */}
          {generated && (
            <div className={`bg-gray-800 border ${colors.border} rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Números Generados — Estrategia: {generated.strategy}
                </h3>
                <span className="text-sm text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                  Confianza: {(generated.confidence * 100).toFixed(0)}%
                </span>
              </div>

              {/* Números grandes */}
              <div className="flex gap-4 justify-center my-6">
                {generated.numbers.map((num, i) => (
                  <div
                    key={i}
                    className={`w-16 h-16 ${colors.badge} rounded-full flex items-center justify-center shadow-lg`}
                  >
                    <span className="text-white font-bold text-2xl">{num}</span>
                  </div>
                ))}
              </div>

              {/* Estadísticas de predicción mejorada */}
              {predictionStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400">Números Calientes</p>
                    <p className="text-sm font-bold text-green-400 mt-1">
                      {predictionStats.hotNumbers.slice(0, 5).join(", ")}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400">Números Fríos</p>
                    <p className="text-sm font-bold text-blue-400 mt-1">
                      {predictionStats.coldNumbers.slice(0, 5).join(", ")}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400">Atrasados</p>
                    <p className="text-sm font-bold text-yellow-400 mt-1">
                      {predictionStats.overdueNumbers.slice(0, 5).join(", ")}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400">Tendencia</p>
                    <p className="text-sm font-bold text-white mt-1 capitalize">
                      {predictionStats.trend}
                    </p>
                  </div>
                </div>
              )}

              {/* Suma promedio */}
              {predictionStats && (
                <div className="bg-gray-700/30 rounded-lg p-3 mb-4 text-center">
                  <span className="text-xs text-gray-400">Suma promedio histórica: </span>
                  <span className="text-sm font-bold text-white">{predictionStats.avgSum}</span>
                  <span className="text-xs text-gray-400 ml-4">Suma de combinación: </span>
                  <span className={`text-sm font-bold ${Math.abs(generated.numbers.reduce((a, b) => a + b, 0) - predictionStats.avgSum) < 20 ? "text-green-400" : "text-yellow-400"}`}>
                    {generated.numbers.reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              )}

              {/* Razones */}
              <div className="bg-gray-700/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-400 mb-2">Por qué estos números:</p>
                <ul className="space-y-1">
                  {generated.reasons.map((reason, i) => (
                    <li key={i} className="text-sm text-white flex items-center gap-2">
                      <span className="text-green-400">✓</span> {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botón regenerar */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-4 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Generar otra combinación
              </button>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-sm text-yellow-400">
              ⚠️ <strong>Aviso:</strong> Estos números son generados basándose en análisis estadístico histórico.
              La lotería es un juego de azar y ningún método garantiza resultados.
              Juega responsablemente.
            </p>
          </div>
        </div>
      )}

      {/* Historial reciente */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Historial Reciente
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="px-4 py-3 text-left">Sorteo</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Números</th>
                {draws[0]?.bonusNumber && (
                  <th className="px-4 py-3 text-left">Adicional</th>
                )}
              </tr>
            </thead>
            <tbody>
              {draws.map((draw) => (
                <tr
                  key={draw.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30"
                >
                  <td className="px-4 py-3 text-white font-medium">
                    #{draw.drawNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(draw.drawDate + "T12:00:00").toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {draw.mainNumbers.map((num, i) => (
                        <span
                          key={i}
                          className={`w-7 h-7 ${colors.badge} rounded-full flex items-center justify-center text-xs text-white font-bold`}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </td>
                  {draw.bonusNumber && (
                    <td className="px-4 py-3">
                      <span className="w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white font-bold">
                        {draw.bonusNumber}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
