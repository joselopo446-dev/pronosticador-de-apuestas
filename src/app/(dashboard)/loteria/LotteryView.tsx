// =============================================
// LOTTERY VIEW — UI PROFESIONAL V2
// =============================================
// Diseño premium con sistema de diseño unificado

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
import {
  Card,
  Button,
  StatCard,
  Badge,
  LotteryNumber,
  ProgressBar,
  Tabs,
  EmptyState,
  LoadingSpinner,
} from "@/components/ui";

interface LotteryViewProps {
  name: string;
  slug: string;
  color: "purple" | "pink" | "yellow";
  minNumber: number;
  maxNumber: number;
  numbersCount: number;
  draws: LotteryDraw[];
}

const colorConfig = {
  purple: {
    gradient: "from-purple-500 to-purple-600",
    glow: "shadow-purple-500/30",
    text: "text-purple-400",
    bg: "bg-purple-500",
    border: "border-purple-500/30",
    ring: "ring-purple-500/50",
  },
  pink: {
    gradient: "from-pink-500 to-pink-600",
    glow: "shadow-pink-500/30",
    text: "text-pink-400",
    bg: "bg-pink-500",
    border: "border-pink-500/30",
    ring: "ring-pink-500/50",
  },
  yellow: {
    gradient: "from-yellow-500 to-yellow-600",
    glow: "shadow-yellow-500/30",
    text: "text-yellow-400",
    bg: "bg-yellow-500",
    border: "border-yellow-500/30",
    ring: "ring-yellow-500/50",
  },
};

type TabId = "frecuencias" | "calientes" | "atrasados" | "coocurrencia" | "patrones" | "backtest" | "temporal" | "generar" | "expert";

export default function LotteryView({
  name,
  slug,
  color,
  minNumber,
  maxNumber,
  numbersCount,
  draws,
}: LotteryViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("frecuencias");
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

  const colors = colorConfig[color];

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

  useEffect(() => {
    if (activeTab === "patrones" && !patterns) {
      setPatterns(analyzePatterns(draws, 30));
    }
  }, [activeTab, patterns, draws]);

  useEffect(() => {
    if (activeTab === "backtest" && !backtest) {
      setBacktest(runBacktest(draws, maxNumber, slug));
    }
  }, [activeTab, backtest, draws, maxNumber, slug]);

  function handleGenerate() {
    setIsGenerating(true);
    setTimeout(async () => {
      try {
        const { generatePrediction } = await import("@/lib/lottery-predictor");
        const strategyMap: Record<string, string> = {
          frecuencia: "hot-cold-balance",
          atrasados: "delta-optimal",
          mixto: "ensemble",
          aleatorio: "expert-balance",
        };
        const result = generatePrediction(draws, strategyMap[genStrategy] || "ensemble", slug);
        setGenerated({
          numbers: result.numbers,
          strategy: result.strategies[0] || genStrategy,
          confidence: result.confidence,
          reasons: result.factors.map((f) => `${f.name}: ${f.value} — ${f.description}`),
        });
        setPredictionStats(result.statistics);
      } catch {
        const result = generateNumbers(draws, minNumber, maxNumber, numbersCount, genStrategy);
        setGenerated(result);
      }
      setIsGenerating(false);
    }, 500);
  }

  const tabs = [
    { id: "frecuencias", label: "Frecuencias", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { id: "calientes", label: "Calientes", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg> },
    { id: "atrasados", label: "Atrasados", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
    { id: "coocurrencia", label: "Coocurrencia", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
    { id: "patrones", label: "Patrones", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: "backtest", label: "Backtest", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: "generar", label: "Generar", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { id: "expert", label: "Expert", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800/80 via-gray-900/80 to-gray-800/80 border border-gray-700/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
        <div className="relative flex items-center gap-6">
          <div className={`w-20 h-20 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center shadow-2xl ${colors.glow}`}>
            <span className="text-white font-bold text-3xl">{name[0]}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">{name}</h1>
            <p className="text-gray-400 text-lg">
              {numbersCount} números del {minNumber} al {maxNumber} — {draws.length} sorteos analizados
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{draws.length}</p>
              <p className="text-sm text-gray-400">Sorteos</p>
            </div>
            <div className="w-px h-12 bg-gray-700" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{maxNumber}</p>
              <p className="text-sm text-gray-400">Números</p>
            </div>
          </div>
        </div>
      </div>

      {/* Último sorteo destacado */}
      {draws.length > 0 && (
        <Card variant="gradient" color={color} padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-2 h-2 ${colors.bg} rounded-full animate-pulse`} />
            <h2 className={`text-xl font-semibold ${colors.text}`}>
              Último Sorteo — #{draws[0].drawNumber}
            </h2>
          </div>
          <p className="text-gray-400 mb-6">
            {new Date(draws[0].drawDate + "T12:00:00").toLocaleDateString("es-MX", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            {draws[0].mainNumbers.map((num, i) => (
              <LotteryNumber key={i} number={num} color={color} size="lg" />
            ))}
            {draws[0].bonusNumber && (
              <>
                <div className="text-2xl text-gray-500 mx-2">+</div>
                <LotteryNumber number={draws[0].bonusNumber} color="gray" size="lg" />
              </>
            )}
          </div>
        </Card>
      )}

      {/* Tabs de análisis */}
      <div className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg ${colors.glow}`
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de tabs */}
      <div className="min-h-[400px]">
        {/* Frecuencias */}
        {activeTab === "frecuencias" && (
          <Card padding="lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Frecuencia de Números</h3>
                <p className="text-gray-400 text-sm">Top 20 números más frecuentes</p>
              </div>
              <Badge variant="info">{draws.length} sorteos</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {frequencies.slice(0, 20).map((freq, index) => (
                <div
                  key={freq.number}
                  className="relative p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200 group"
                >
                  <div className="absolute top-2 left-2 text-xs text-gray-600 font-mono">
                    #{index + 1}
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${colors.text} group-hover:scale-110 transition-transform`}>
                      {freq.number}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{freq.absoluteFrequency} veces</div>
                    <div className="text-xs text-gray-500">{freq.relativeFrequency.toFixed(1)}%</div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={freq.relativeFrequency} max={Math.max(...frequencies.map(f => f.relativeFrequency))} color={color} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Calientes */}
        {activeTab === "calientes" && (
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Números Calientes</h3>
                <p className="text-gray-400 text-sm">Los que más aparecen recientemente</p>
              </div>
            </div>
            <div className="space-y-3">
              {hotNumbers.map((freq, i) => (
                <div
                  key={freq.number}
                  className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:border-red-500/30 transition-all duration-200 group"
                >
                  <span className="text-gray-600 font-mono text-sm w-8">#{i + 1}</span>
                  <LotteryNumber number={freq.number} color="pink" size="md" />
                  <div className="flex-1">
                    <p className="text-white font-medium group-hover:text-red-400 transition-colors">
                      Número {freq.number}
                    </p>
                    <p className="text-gray-400 text-sm">{freq.absoluteFrequency} apariciones</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-400">{freq.relativeFrequency.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">frecuencia</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Atrasados */}
        {activeTab === "atrasados" && (
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Números Atrasados</h3>
                <p className="text-gray-400 text-sm">Deben salir según frecuencia histórica</p>
              </div>
            </div>
            <div className="space-y-3">
              {overdueNumbers.map((freq, i) => (
                <div
                  key={freq.number}
                  className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:border-blue-500/30 transition-all duration-200 group"
                >
                  <span className="text-gray-600 font-mono text-sm w-8">#{i + 1}</span>
                  <LotteryNumber number={freq.number} color="blue" size="md" />
                  <div className="flex-1">
                    <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                      Número {freq.number}
                    </p>
                    <p className="text-gray-400 text-sm">{freq.absoluteFrequency} apariciones históricas</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">{freq.drawsSinceLast}</div>
                    <div className="text-xs text-gray-500">sorteos sin salir</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Coocurrencia */}
        {activeTab === "coocurrencia" && (
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl">
                <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Pares que Más Salen Juntos</h3>
                <p className="text-gray-400 text-sm">Co-ocurrencia entre números</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cooccurrences.slice(0, 10).map((co, i) => (
                <div
                  key={`${co.numberA}-${co.numberB}`}
                  className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:border-yellow-500/30 transition-all duration-200"
                >
                  <span className="text-gray-600 font-mono text-sm w-8">#{i + 1}</span>
                  <div className="flex items-center gap-2">
                    <LotteryNumber number={co.numberA} color="yellow" size="md" />
                    <span className="text-gray-500">&</span>
                    <LotteryNumber number={co.numberB} color="yellow" size="md" />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-lg font-bold text-white">{co.cooccurrenceCount} veces</div>
                    <div className="text-xs text-gray-400">{(co.cooccurrenceRate * 100).toFixed(1)}% de sorteos</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Patrones */}
        {activeTab === "patrones" && patterns && (
          <div className="space-y-6">
            <div className="flex gap-2">
              {(["suma", "parimpar", "relaciones", "secuencia"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActivePatternTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activePatternTab === tab
                      ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg ${colors.glow}`
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  {tab === "suma" && "Suma"}
                  {tab === "parimpar" && "Par/Impar"}
                  {tab === "relaciones" && "Relaciones"}
                  {tab === "secuencia" && "Secuencia"}
                </button>
              ))}
            </div>

            {activePatternTab === "suma" && (
              <Card padding="lg">
                <h3 className={`text-xl font-semibold ${colors.text} mb-2`}>Análisis de Suma</h3>
                <p className="text-gray-400 text-sm mb-6">Rangos de suma más frecuentes</p>
                <div className="space-y-4">
                  {patterns.sumAnalysis.map((s) => (
                    <div key={s.range} className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-xl">
                      <div className="flex-1">
                        <span className="text-white font-medium">{s.range}</span>
                        <span className="text-gray-400 text-sm ml-2">({s.count} sorteos)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-40">
                          <ProgressBar value={s.percentage} color={s.isHot ? "red" : color} size="sm" />
                        </div>
                        <span className="text-sm text-white w-16 text-right">{s.percentage.toFixed(1)}%</span>
                        {s.isHot && <Badge variant="danger" size="sm">Caliente</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activePatternTab === "parimpar" && (
              <Card padding="lg">
                <h3 className={`text-xl font-semibold ${colors.text} mb-6`}>Distribución Par/Impar</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/20">
                    <p className="text-5xl font-bold text-blue-400">{patterns.oddEvenAnalysis.oddCount}</p>
                    <p className="text-gray-400 mt-2">Impares</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl border border-yellow-500/20">
                    <p className="text-5xl font-bold text-yellow-400">{patterns.oddEvenAnalysis.evenCount}</p>
                    <p className="text-gray-400 mt-2">Pares</p>
                  </div>
                </div>
                <p className="text-center text-gray-400 mt-6">{patterns.oddEvenAnalysis.ratio}</p>
                <p className="text-center text-white mt-2">
                  Dominante: <span className={`font-bold ${colors.text}`}>{patterns.oddEvenAnalysis.dominant}</span>
                </p>
              </Card>
            )}

            {activePatternTab === "relaciones" && (
              <Card padding="lg">
                <h3 className={`text-xl font-semibold ${colors.text} mb-6`}>Relaciones Numéricas</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/20">
                    <p className="text-4xl font-bold text-green-400">{patterns.numberRelationships.primeCount}</p>
                    <p className="text-gray-400 mt-2">Primos</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/20">
                    <p className="text-4xl font-bold text-purple-400">{patterns.numberRelationships.fibonacciCount}</p>
                    <p className="text-gray-400 mt-2">Fibonacci</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-gray-500/10 to-gray-600/5 rounded-xl border border-gray-500/20">
                    <p className="text-4xl font-bold text-gray-400">{patterns.numberRelationships.compositeCount}</p>
                    <p className="text-gray-400 mt-2">Compuestos</p>
                  </div>
                </div>
                <h4 className="text-white font-medium mb-3">Análisis de Dígitos</h4>
                <div className="space-y-2">
                  {patterns.digitSumAnalysis.map((d) => (
                    <div key={d.digitSumRange} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-400">Suma de dígitos {d.digitSumRange}</span>
                      <span className="text-white font-medium">{d.frequency} apariciones</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activePatternTab === "secuencia" && (
              <Card padding="lg">
                <h3 className={`text-xl font-semibold ${colors.text} mb-6`}>Patrones de Secuencia</h3>
                <div className="space-y-4 mb-6">
                  {patterns.sequencePatterns.map((p) => (
                    <div key={p.pattern} className="p-4 bg-gray-700/30 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">Tendencia: {p.pattern}</span>
                        <Badge variant="info">{p.frequency} números</Badge>
                      </div>
                      <p className="text-sm text-gray-400">{p.description}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-700/30 rounded-xl">
                  <h4 className="text-white font-medium mb-2">Patrones Consecutivos</h4>
                  <p className="text-gray-400 text-sm">
                    {patterns.consecutiveAnalysis.percentage.toFixed(1)}% de sorteos tienen números consecutivos.
                    {patterns.consecutiveAnalysis.hasConsecutive ? " Es común encontrar consecutivos." : " No es muy común."}
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Backtest */}
        {activeTab === "backtest" && backtest && (
          <div className="space-y-6">
            <Card variant="gradient" color="yellow" padding="lg">
              <h3 className="text-xl font-semibold text-white mb-2">Backtest de Estrategias</h3>
              <p className="text-gray-400 text-sm mb-4">
                Prueba cada estrategia en los últimos 50 sorteos
              </p>
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-400 font-medium">{backtest.overallVerdict}</p>
              </div>
            </Card>

            {backtest.results.map((r) => (
              <Card key={r.strategyName} padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-medium text-lg">{r.strategyName}</h4>
                  <Badge variant={r.roi > 0 ? "success" : "danger"}>
                    ROI: {r.roi.toFixed(1)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: "3 aciertos", actual: r.matches.three, expected: r.expectedThree, color: "blue" },
                    { label: "4 aciertos", actual: r.matches.four, expected: r.expectedFour, color: "yellow" },
                    { label: "5 aciertos", actual: r.matches.five, expected: r.expectedFive, color: "purple" },
                    { label: "6 aciertos", actual: r.matches.six, expected: r.expectedSix, color: "green" },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-4 bg-gray-700/30 rounded-xl">
                      <p className={`text-3xl font-bold text-${m.color}-400`}>{m.actual}</p>
                      <p className="text-sm text-gray-400 mt-1">{m.label}</p>
                      <p className="text-xs text-gray-500">Esperado: {m.expected.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-gray-700/30 rounded-lg">
                  <p className="text-sm text-gray-400">{r.verdict}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Generar */}
        {activeTab === "generar" && (
          <div className="space-y-6">
            <Card padding="lg">
              <h3 className="text-xl font-semibold text-white mb-2">Generar Números</h3>
              <p className="text-gray-400 text-sm mb-6">
                Selecciona una estrategia para generar una combinación
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { id: "mixto" as const, name: "Mixto", desc: "Recomendado", icon: "🎯" },
                  { id: "frecuencia" as const, name: "Frecuencia", desc: "Más frecuentes", icon: "🔥" },
                  { id: "atrasados" as const, name: "Atrasados", desc: "Deben salir", icon: "❄️" },
                  { id: "aleatorio" as const, name: "Aleatorio", desc: "Al azar", icon: "🎲" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setGenStrategy(s.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      genStrategy === s.id
                        ? `bg-gradient-to-br ${colors.gradient} border-transparent shadow-lg ${colors.glow}`
                        : "bg-gray-700/30 border-gray-600/30 hover:border-gray-500/50"
                    }`}
                  >
                    <span className="text-3xl">{s.icon}</span>
                    <p className="text-sm font-semibold text-white mt-3">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
                  </button>
                ))}
              </div>
              <Button
                onClick={handleGenerate}
                loading={isGenerating}
                variant="primary"
                size="lg"
              >
                Generar Combinación
              </Button>
            </Card>

            {generated && (
              <Card variant="gradient" color={color} padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Números Generados</h3>
                  <Badge variant="success">Confianza: {(generated.confidence * 100).toFixed(0)}%</Badge>
                </div>

                <div className="flex gap-5 justify-center my-8">
                  {generated.numbers.map((num, i) => (
                    <LotteryNumber key={i} number={num} color={color} size="lg" />
                  ))}
                </div>

                {predictionStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-gray-700/30 rounded-xl text-center">
                      <p className="text-xs text-gray-400 mb-1">Calientes</p>
                      <p className="text-sm font-bold text-green-400">
                        {predictionStats.hotNumbers.slice(0, 5).join(", ")}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-700/30 rounded-xl text-center">
                      <p className="text-xs text-gray-400 mb-1">Fríos</p>
                      <p className="text-sm font-bold text-blue-400">
                        {predictionStats.coldNumbers.slice(0, 5).join(", ")}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-700/30 rounded-xl text-center">
                      <p className="text-xs text-gray-400 mb-1">Atrasados</p>
                      <p className="text-sm font-bold text-yellow-400">
                        {predictionStats.overdueNumbers.slice(0, 5).join(", ")}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-700/30 rounded-xl text-center">
                      <p className="text-xs text-gray-400 mb-1">Tendencia</p>
                      <p className="text-sm font-bold text-white capitalize">{predictionStats.trend}</p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gray-700/30 rounded-xl mb-4">
                  <p className="text-sm text-gray-400 mb-3">Por qué estos números:</p>
                  <ul className="space-y-2">
                    {generated.reasons.map((reason, i) => (
                      <li key={i} className="text-sm text-white flex items-center gap-2">
                        <span className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button onClick={handleGenerate} variant="secondary" fullWidth>
                  Generar otra combinación
                </Button>
              </Card>
            )}

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-sm text-yellow-400">
                <strong>Aviso:</strong> Estos números son generados basándose en análisis estadístico histórico.
                La lotería es un juego de azar y ningún método garantiza resultados. Juega responsablemente.
              </p>
            </div>
          </div>
        )}

        {/* Expert */}
        {activeTab === "expert" && (
          <Card variant="gradient" color="purple" padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Predictor Experto</h3>
                <p className="text-gray-400 text-sm">7 estrategias avanzadas de predicción</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="text-white font-semibold mb-4">Estrategias</h4>
                {[
                  "Ensemble Experto",
                  "Balance de Familias",
                  "Deltas Óptimos",
                  "Análisis Posicional",
                  "Suma Óptima",
                  "Balance Caliente/Frío",
                  "Primos y Fibonacci",
                ].map((strategy, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-purple-400 font-bold text-sm">{i + 1}</span>
                    </div>
                    <span className="text-gray-300">{strategy}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-semibold mb-4">Secretos de Expertos</h4>
                {[
                  { icon: "✓", text: "Balance de Familias" },
                  { icon: "✓", text: "Suma Óptima (90-180)" },
                  { icon: "✓", text: "Pocos Consecutivos" },
                  { icon: "✓", text: "Balance Par/Impar" },
                  { icon: "✓", text: "Números Atrasados" },
                  { icon: "✓", text: "Primos Incluidos" },
                  { icon: "✓", text: "Dígitos Diferentes" },
                ].map((secret, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl">
                    <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-gray-300">{secret.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/lottery/predictions", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: slug, strategy: "ensemble", forceGenerate: true }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert(`Predicciones expertas generadas para ${name}!`);
                    }
                  } catch {
                    alert("Error generando predicciones");
                  }
                }}
                variant="primary"
                size="lg"
                fullWidth
              >
                Generar Predicciones Expertas
              </Button>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-sm text-yellow-400">
                <strong>Aviso:</strong> Estas predicciones usan técnicas avanzadas de análisis estadístico,
                pero la lotería sigue siendo un juego de azar. Ningún método garantiza resultados. Juega responsablemente.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Historial reciente */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Historial Reciente</h3>
          <Badge variant="info">{draws.length} sorteos</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="px-4 py-3 text-left font-medium">Sorteo</th>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-left font-medium">Números</th>
                {draws[0]?.bonusNumber && (
                  <th className="px-4 py-3 text-left font-medium">Adicional</th>
                )}
              </tr>
            </thead>
            <tbody>
              {draws.map((draw) => (
                <tr
                  key={draw.id}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">#{draw.drawNumber}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(draw.drawDate + "T12:00:00").toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {draw.mainNumbers.map((num, i) => (
                        <LotteryNumber key={i} number={num} color={color} size="sm" />
                      ))}
                    </div>
                  </td>
                  {draw.bonusNumber && (
                    <td className="px-4 py-3">
                      <LotteryNumber number={draw.bonusNumber} color="gray" size="sm" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
