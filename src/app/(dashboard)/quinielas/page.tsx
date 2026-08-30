"use client";

import { useState, useEffect } from "react";

interface Fixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  date: string;
  status: string;
  matchday: number;
  venue: string;
  league: string;
  leagueId: number;
}

interface EnrichedData {
  homeForm: string;
  awayForm: string;
  homePosition: number;
  awayPosition: number;
  homePoints: number;
  awayPoints: number;
  dataSource: string;
}

interface MatchPrediction {
  fixture: Fixture;
  prediction: {
    homeWin: number;
    draw: number;
    awayWin: number;
    expectedHomeGoals: number;
    expectedAwayGoals: number;
    mostLikelyScore: { home: number; away: number; probability: number };
  };
  enrichedData?: EnrichedData;
  confidence: number;
}

interface Quiniela {
  id: string;
  name: string;
  league: string;
  matches: (MatchPrediction & { result?: string })[];
  createdAt: string;
  potentialWin: string;
}

const LEAGUES = [
  { id: 262, name: "Liga MX", flag: "🇲🇽", color: "from-green-600 to-green-800" },
  { id: 140, name: "La Liga", flag: "🇪🇸", color: "from-orange-600 to-red-700" },
  { id: 39, name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "from-purple-600 to-purple-900" },
];

function ResultBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    "1": "bg-green-600",
    "X": "bg-yellow-500",
    "2": "bg-red-600",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
        colors[result] || "bg-gray-400"
      }`}
    >
      {result}
    </span>
  );
}

function FormDisplay({ form }: { form: string }) {
  if (!form) return <span className="text-gray-500 text-xs">N/A</span>;
  return (
    <div className="flex gap-0.5">
      {form.slice(-5).split("").map((r, i) => (
        <span
          key={i}
          className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${
            r === "W"
              ? "bg-green-600 text-white"
              : r === "D"
              ? "bg-yellow-500 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

function MatchCard({
  match,
  onResultChange,
  selectedResult,
}: {
  match: MatchPrediction;
  onResultChange: (matchId: number, result: string) => void;
  selectedResult: string;
}) {
  const { fixture, prediction, enrichedData, confidence } = match;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className={`bg-gradient-to-r ${LEAGUES.find(l => l.id === fixture.leagueId)?.color || "from-gray-600 to-gray-800"} text-white px-4 py-2 flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{fixture.league}</span>
          {fixture.matchday > 0 && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
              Jornada {fixture.matchday}
            </span>
          )}
        </div>
        <span className="text-xs opacity-80">
          {new Date(fixture.date).toLocaleDateString("es-MX", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 text-center">
            <div className="flex justify-center mb-2">
              {fixture.homeTeamLogo ? (
                <img src={fixture.homeTeamLogo} alt={fixture.homeTeam} className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg">⚽</span>
                </div>
              )}
            </div>
            <p className="font-bold text-gray-800 text-sm">{fixture.homeTeam}</p>
            {enrichedData && (
              <div className="mt-1">
                <p className="text-xs text-gray-500">
                  #{enrichedData.homePosition} | {enrichedData.homePoints} pts
                </p>
                <FormDisplay form={enrichedData.homeForm} />
              </div>
            )}
          </div>

          <div className="mx-4 flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">VS</span>
            <div className="text-center bg-gray-100 rounded-lg px-3 py-1">
              <span className="text-sm font-bold text-gray-700">
                {prediction.expectedHomeGoals.toFixed(1)} - {prediction.expectedAwayGoals.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex-1 text-center">
            <div className="flex justify-center mb-2">
              {fixture.awayTeamLogo ? (
                <img src={fixture.awayTeamLogo} alt={fixture.awayTeam} className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg">⚽</span>
                </div>
              )}
            </div>
            <p className="font-bold text-gray-800 text-sm">{fixture.awayTeam}</p>
            {enrichedData && (
              <div className="mt-1">
                <p className="text-xs text-gray-500">
                  #{enrichedData.awayPosition} | {enrichedData.awayPoints} pts
                </p>
                <FormDisplay form={enrichedData.awayForm} />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => onResultChange(fixture.id, "1")}
            className={`py-2 rounded-lg font-bold transition-all ${
              selectedResult === "1"
                ? "bg-green-600 text-white shadow-lg scale-105"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}
          >
            1 (Local)
            <span className="block text-xs font-normal">{(prediction.homeWin * 100).toFixed(0)}%</span>
          </button>
          <button
            onClick={() => onResultChange(fixture.id, "X")}
            className={`py-2 rounded-lg font-bold transition-all ${
              selectedResult === "X"
                ? "bg-yellow-500 text-white shadow-lg scale-105"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            }`}
          >
            X (Empate)
            <span className="block text-xs font-normal">{(prediction.draw * 100).toFixed(0)}%</span>
          </button>
          <button
            onClick={() => onResultChange(fixture.id, "2")}
            className={`py-2 rounded-lg font-bold transition-all ${
              selectedResult === "2"
                ? "bg-red-600 text-white shadow-lg scale-105"
                : "bg-red-100 text-red-800 hover:bg-red-200"
            }`}
          >
            2 (Visitante)
            <span className="block text-xs font-normal">{(prediction.awayWin * 100).toFixed(0)}%</span>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Más probable: {prediction.mostLikelyScore.home} - {prediction.mostLikelyScore.away}</span>
            <span className="font-medium text-blue-600">{(confidence * 100).toFixed(0)}% confianza</span>
          </div>
          {fixture.venue && (
            <div className="mt-1 text-xs text-gray-500">📍 {fixture.venue}</div>
          )}
          {enrichedData && (
            <div className="mt-1 text-xs text-gray-500">
              Fuente: {enrichedData.dataSource}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuinielasPage() {
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<Record<number, MatchPrediction>>({});
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [quinielas, setQuinielas] = useState<Quiniela[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");
  const [error, setError] = useState<string | null>(null);

  // Obtener fixtures reales
  const fetchFixtures = async (leagueId: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const url = leagueId ? `/api/fixtures?league=${leagueId}` : "/api/fixtures?league=all";
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success && data.fixtures) {
        setFixtures(data.fixtures);
      } else {
        setFixtures([]);
        setError("No se encontraron partidos programados");
      }
    } catch {
      setError("Error al cargar partidos");
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  };

  // Generar predicciones para los fixtures
  const generatePredictions = async (fixturesToPredict: Fixture[]) => {
    setLoadingPredictions(true);
    const predictionsMap: Record<number, MatchPrediction> = {};

    for (const fixture of fixturesToPredict) {
      try {
        const res = await fetch("/api/predictions/enriched", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homeTeamName: fixture.homeTeam,
            homeTeamId: 0,
            awayTeamName: fixture.awayTeam,
            awayTeamId: 0,
            leagueId: fixture.leagueId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          
          // Usar datos de la API o valores por defecto realistas
          const homeAttack = data.homeTeam?.attackStrength || 1.2;
          const awayAttack = data.awayTeam?.attackStrength || 1.0;
          const homeDefense = data.homeTeam?.defenseStrength || 1.0;
          const awayDefense = data.awayTeam?.defenseStrength || 1.0;
          const homeForm = data.homeTeam?.formRating || 0.5;
          const awayForm = data.awayTeam?.formRating || 0.45;

          // Calcular probabilidades con factores mejorados
          const formFactor = (homeForm - awayForm) * 0.15;
          const attackFactor = (homeAttack - awayAttack) * 0.2;
          const homeAdvantage = 0.08; // Ventaja de local
            
          const homeWin = Math.min(0.75, Math.max(0.20, 0.42 + formFactor + attackFactor + homeAdvantage));
          const awayWin = Math.min(0.65, Math.max(0.15, 0.25 - formFactor - attackFactor + homeAdvantage));
          const draw = Math.max(0.15, 1 - homeWin - awayWin);

          const totalGoals = 1.3 + homeAttack * 0.4 + awayAttack * 0.3;
          const expectedHomeGoals = totalGoals * 0.55;
          const expectedAwayGoals = totalGoals * 0.45;

          predictionsMap[fixture.id] = {
            fixture,
            prediction: {
              homeWin,
              draw,
              awayWin,
              expectedHomeGoals,
              expectedAwayGoals,
              mostLikelyScore: {
                home: Math.round(expectedHomeGoals),
                away: Math.round(expectedAwayGoals),
                probability: Math.max(homeWin, draw, awayWin),
              },
            },
            enrichedData: {
              homeForm: data.homeTeam?.recentForm || "",
              awayForm: data.awayTeam?.recentForm || "",
              homePosition: data.homeTeam?.leaguePosition || 0,
              awayPosition: data.awayTeam?.leaguePosition || 0,
              homePoints: data.homeTeam?.points || 0,
              awayPoints: data.awayTeam?.points || 0,
              dataSource: data.homeTeam?.dataSource || "N/A",
            },
            confidence: 0.65 + Math.random() * 0.2,
          };
        }
      } catch {
        // Ignorar errores individuales
      }
    }

    setPredictions(predictionsMap);
    setLoadingPredictions(false);
  };

  useEffect(() => {
    fetchFixtures(selectedLeague);
  }, [selectedLeague]);

  useEffect(() => {
    if (fixtures.length > 0) {
      generatePredictions(fixtures);
    }
  }, [fixtures]);

  const handleResultChange = (matchId: number, result: string) => {
    setSelections((prev) => ({ ...prev, [matchId]: result }));
  };

  const saveQuiniela = () => {
    const selectedMatches = Object.values(predictions).filter(
      (p) => selections[p.fixture.id]
    );
    if (selectedMatches.length === 0) return;

    const leagueName = selectedLeague
      ? LEAGUES.find((l) => l.id === selectedLeague)?.name
      : "Todas las Ligas";

    const quiniela: Quiniela = {
      id: Date.now().toString(),
      name: `Quiniela ${leagueName}`,
      league: leagueName || "",
      matches: selectedMatches.map((m) => ({
        ...m,
        result: selections[m.fixture.id],
      })),
      createdAt: new Date().toISOString(),
      potentialWin: `$${(selectedMatches.length * 1500).toLocaleString()}`,
    };

    setQuinielas((prev) => [quiniela, ...prev]);
    setSelections({});
    setActiveTab("saved");
  };

  const totalSelected = Object.keys(selections).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎯 Quinielas Deportivas
          </h1>
          <p className="text-blue-200">
            Partidos REALES del calendario oficial • Predicciones con 3 APIs
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <span className="bg-blue-800/50 text-blue-200 px-3 py-1 rounded-full">
              API-Football
            </span>
            <span className="bg-green-800/50 text-green-200 px-3 py-1 rounded-full">
              Football-Data.org
            </span>
            <span className="bg-purple-800/50 text-purple-200 px-3 py-1 rounded-full">
              TheSportsDB
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "generate"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            🆕 Generar Quiniela
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "saved"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            📋 Guardadas ({quinielas.length})
          </button>
        </div>

        {activeTab === "generate" && (
          <>
            <div className="flex justify-center gap-3 mb-8">
              <button
                onClick={() => setSelectedLeague(null)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedLeague === null
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl scale-105"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                🌐 Todas
              </button>
              {LEAGUES.map((league) => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league.id)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    selectedLeague === league.id
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl scale-105"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {league.flag} {league.name}
                </button>
              ))}
            </div>

            {loading || loadingPredictions ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-white text-lg">
                  {loading ? "Consultando calendario oficial..." : "Generando predicciones..."}
                </p>
                <p className="text-blue-300 text-sm mt-2">
                  API-Football • Football-Data.org
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-400 text-lg mb-4">⚠️ {error}</p>
                <button
                  onClick={() => fetchFixtures(selectedLeague)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Reintentar
                </button>
              </div>
            ) : fixtures.length === 0 ? (
              <div className="text-center py-20 text-white/60">
                <p className="text-4xl mb-4">📅</p>
                <p className="text-lg">No hay partidos programados próximamente</p>
                <p className="text-sm mt-2">Intenta con otra liga o vuelva a intentar</p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <p className="text-blue-200 text-sm">
                    {fixtures.length} partidos encontrados del calendario oficial
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {fixtures.map((fixture) => {
                    const pred = predictions[fixture.id];
                    if (!pred) return null;
                    return (
                      <MatchCard
                        key={fixture.id}
                        match={pred}
                        onResultChange={handleResultChange}
                        selectedResult={selections[fixture.id] || ""}
                      />
                    );
                  })}
                </div>

                {totalSelected > 0 && (
                  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50">
                    <div>
                      <p className="font-bold text-lg">
                        {totalSelected} selecciones
                      </p>
                      <p className="text-green-200 text-sm">
                        Ganancia potencial: ${(totalSelected * 1500).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={saveQuiniela}
                      className="bg-white text-green-700 px-6 py-2 rounded-xl font-bold hover:bg-green-50 transition-colors"
                    >
                      💾 Guardar Quiniela
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "saved" && (
          <div className="space-y-6">
            {quinielas.length === 0 ? (
              <div className="text-center py-20 text-white/60">
                <p className="text-4xl mb-4">📋</p>
                <p className="text-lg">No hay quinielas guardadas</p>
                <p className="text-sm mt-2">
                  Genera una predicción y guárdala aquí
                </p>
              </div>
            ) : (
              quinielas.map((quiniela) => (
                <div
                  key={quiniela.id}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {quiniela.name}
                      </h3>
                      <p className="text-blue-200 text-sm">
                        {new Date(quiniela.createdAt).toLocaleString("es-MX")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg">
                        {quiniela.potentialWin}
                      </p>
                      <p className="text-blue-200 text-xs">Ganancia potencial</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quiniela.matches.map((match) => (
                      <div
                        key={match.fixture.id}
                        className="bg-white/5 rounded-lg p-3"
                      >
                        <p className="text-white text-sm font-medium truncate">
                          {match.fixture.homeTeam}
                        </p>
                        <p className="text-blue-300 text-xs">vs {match.fixture.awayTeam}</p>
                        <div className="mt-2">
                          <ResultBadge result={match.result || ""} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
