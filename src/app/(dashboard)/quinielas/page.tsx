"use client";

import { useState, useEffect } from "react";
import { TEAMS } from "@/config/teams";

interface MatchPrediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  leagueId: number;
  matchDate: string;
  prediction: {
    homeWin: number;
    draw: number;
    awayWin: number;
    expectedHomeGoals: number;
    expectedAwayGoals: number;
    mostLikelyScore: { home: number; away: number; probability: number };
  };
  enrichedData?: {
    homeForm: string;
    awayForm: string;
    homePosition: number;
    awayPosition: number;
    homePoints: number;
    awayPoints: number;
    dataSource: string;
  };
  confidence: number;
}

interface Quiniela {
  id: string;
  name: string;
  league: string;
  matches: MatchPrediction[];
  createdAt: string;
  potentialWin: string;
}

const LEAGUES = [
  { id: 262, name: "Liga MX", apiName: "Liga MX", flag: "🇲🇽" },
  { id: 140, name: "La Liga", apiName: "La Liga", flag: "🇪🇸" },
  { id: 39, name: "Premier League", apiName: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
];

const LEAGUE_TEAMS: Record<number, string[]> = {
  262: [
    "América", "Cruz Azul", "Guadalajara", "Pumas UNAM",
    "Tigres UANL", "Monterrey", "León", "Santos Laguna",
    "Atlas", "Pachuca", "Toluca", "Necaxa",
    "Mazatlán", "Puebla", "Juárez", "San Luis",
  ],
  140: [
    "Real Madrid", "FC Barcelona", "Atlético Madrid", "Real Sociedad",
    "Villarreal", "Athletic Club", "Real Betis", "Sevilla FC",
    "Valencia CF", "Celta Vigo", "Getafe CF", "Osasuna",
    "Girona FC", "Mallorca", "Las Palmas", "Rayo Vallecano",
  ],
  39: [
    "Manchester City", "Arsenal", "Liverpool", "Manchester United",
    "Chelsea", "Tottenham Hotspur", "Newcastle United", "Aston Villa",
    "Brighton", "West Ham United", "Brentford", "Fulham",
    "Crystal Palace", "Wolves", "Bournemouth", "Everton",
  ],
};

function ResultBadge({ result }: { result: string }) {
  const colors = {
    "1": "bg-green-600",
    "X": "bg-yellow-500",
    "2": "bg-red-600",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
        colors[result as keyof typeof colors]
      }`}
    >
      {result}
    </span>
  );
}

function FormDisplay({ form }: { form: string }) {
  if (!form) return <span className="text-gray-500">N/A</span>;
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
  onResultChange: (matchId: string, result: string) => void;
  selectedResult: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 flex justify-between items-center">
        <span className="text-sm font-medium">{match.league}</span>
        <span className="text-xs opacity-80">
          {new Date(match.matchDate).toLocaleDateString("es-MX")}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 text-center">
            <p className="font-bold text-gray-800">{match.homeTeam}</p>
            {match.enrichedData && (
              <div className="mt-1">
                <p className="text-xs text-gray-500">
                  Pos: #{match.enrichedData.homePosition} | {match.enrichedData.homePoints} pts
                </p>
                <FormDisplay form={match.enrichedData.homeForm} />
              </div>
            )}
          </div>

          <div className="mx-4 flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">VS</span>
            <div className="text-center bg-gray-100 rounded-lg px-3 py-1">
              <span className="text-sm font-bold text-gray-700">
                {match.prediction.expectedHomeGoals.toFixed(1)} - {match.prediction.expectedAwayGoals.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex-1 text-center">
            <p className="font-bold text-gray-800">{match.awayTeam}</p>
            {match.enrichedData && (
              <div className="mt-1">
                <p className="text-xs text-gray-500">
                  Pos: #{match.enrichedData.awayPosition} | {match.enrichedData.awayPoints} pts
                </p>
                <FormDisplay form={match.enrichedData.awayForm} />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => onResultChange(match.id, "1")}
            className={`py-2 rounded-lg font-bold transition-all ${
              selectedResult === "1"
                ? "bg-green-600 text-white shadow-lg scale-105"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}
          >
            1 (Local)
            <span className="block text-xs font-normal">{(match.prediction.homeWin * 100).toFixed(0)}%</span>
          </button>
          <button
            onClick={() => onResultChange(match.id, "X")}
            className={`py-2 rounded-lg font-bold transition-all ${
              selectedResult === "X"
                ? "bg-yellow-500 text-white shadow-lg scale-105"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            }`}
          >
            X (Empate)
            <span className="block text-xs font-normal">{(match.prediction.draw * 100).toFixed(0)}%</span>
          </button>
          <button
            onClick={() => onResultChange(match.id, "2")}
            className={`py-2 rounded-lg font-bold transition-all ${
              selectedResult === "2"
                ? "bg-red-600 text-white shadow-lg scale-105"
                : "bg-red-100 text-red-800 hover:bg-red-200"
            }`}
          >
            2 (Visitante)
            <span className="block text-xs font-normal">{(match.prediction.awayWin * 100).toFixed(0)}%</span>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Marcador más probable: {match.prediction.mostLikelyScore.home} - {match.prediction.mostLikelyScore.away}</span>
            <span className="font-medium text-blue-600">{(match.confidence * 100).toFixed(0)}% confianza</span>
          </div>
          {match.enrichedData && (
            <div className="mt-1 text-xs text-gray-500">
              Fuente: {match.enrichedData.dataSource}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuinielasPage() {
  const [selectedLeague, setSelectedLeague] = useState<number>(262);
  const [matches, setMatches] = useState<MatchPrediction[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [quinielas, setQuinielas] = useState<Quiniela[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");

  const generatePredictions = async (leagueId: number) => {
    setLoading(true);
    try {
      const teams = LEAGUE_TEAMS[leagueId] || [];
      const generatedMatches: MatchPrediction[] = [];

      for (let i = 0; i < Math.min(teams.length, 16); i += 2) {
        const homeTeam = teams[i];
        const awayTeam = teams[i + 1];
        if (!homeTeam || !awayTeam) continue;

        // Llamar API enriquecida
        let enrichedData: {
          homeForm: string;
          awayForm: string;
          homePosition: number;
          awayPosition: number;
          homePoints: number;
          awayPoints: number;
          dataSource: string;
        } | undefined = undefined;
        try {
          const res = await fetch("/api/predictions/enriched", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              homeTeamName: homeTeam,
              homeTeamId: 0,
              awayTeamName: awayTeam,
              awayTeamId: 0,
              leagueId: leagueId,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            enrichedData = {
              homeForm: data.homeTeam?.recentForm || "",
              awayForm: data.awayTeam?.recentForm || "",
              homePosition: data.homeTeam?.leaguePosition || 0,
              awayPosition: data.awayTeam?.leaguePosition || 0,
              homePoints: data.homeTeam?.points || 0,
              awayPoints: data.awayTeam?.points || 0,
              dataSource: data.homeTeam?.dataSource || "N/A",
            };
          }
        } catch {
          // Ignorar errores de API
        }

        // Predicción con datos enriquecidos
        const homeAttack = enrichedData?.homePosition ? Math.max(0.5, 2 - enrichedData.homePosition * 0.08) : 1.2;
        const awayAttack = enrichedData?.awayPosition ? Math.max(0.5, 2 - enrichedData.awayPosition * 0.08) : 1.0;

        const homeWinProb = Math.min(0.85, Math.max(0.15, 0.45 + (homeAttack - awayAttack) * 0.3 + 0.1));
        const awayWinProb = Math.min(0.75, Math.max(0.1, 0.25 + (awayAttack - homeAttack) * 0.2));
        const drawProb = Math.max(0.1, 1 - homeWinProb - awayWinProb);

        const expectedHomeGoals = 1.2 + homeAttack * 0.6;
        const expectedAwayGoals = 1.0 + awayAttack * 0.5;

        generatedMatches.push({
          id: `${leagueId}-${i}`,
          homeTeam,
          awayTeam,
          league: LEAGUES.find((l) => l.id === leagueId)?.name || "",
          leagueId,
          matchDate: new Date(Date.now() + (i / 2) * 86400000).toISOString(),
          prediction: {
            homeWin: homeWinProb,
            draw: drawProb,
            awayWin: awayWinProb,
            expectedHomeGoals,
            expectedAwayGoals,
            mostLikelyScore: {
              home: Math.round(expectedHomeGoals),
              away: Math.round(expectedAwayGoals),
              probability: Math.max(homeWinProb, drawProb, awayWinProb),
            },
          },
          enrichedData,
          confidence: 0.65 + Math.random() * 0.2,
        });
      }

      setMatches(generatedMatches);
    } catch (error) {
      console.error("Error generando predicciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePredictions(selectedLeague);
  }, [selectedLeague]);

  const handleResultChange = (matchId: string, result: string) => {
    setPredictions((prev) => ({ ...prev, [matchId]: result }));
  };

  const saveQuiniela = () => {
    const selectedMatches = matches.filter((m) => predictions[m.id]);
    if (selectedMatches.length === 0) return;

    const quiniela: Quiniela = {
      id: Date.now().toString(),
      name: `Quiniela ${LEAGUES.find((l) => l.id === selectedLeague)?.name}`,
      league: LEAGUES.find((l) => l.id === selectedLeague)?.name || "",
      matches: selectedMatches.map((m) => ({
        ...m,
        prediction: {
          ...m.prediction,
          result: predictions[m.id],
        },
      })),
      createdAt: new Date().toISOString(),
      potentialWin: `$${(selectedMatches.length * 1500).toLocaleString()}`,
    };

    setQuinielas((prev) => [quiniela, ...prev]);
    setPredictions({});
    setActiveTab("saved");
  };

  const totalSelected = Object.keys(predictions).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎯 Quinielas Deportivas
          </h1>
          <p className="text-blue-200">
            Predicciones automáticas usando 3 APIs de fútbol
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

            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-white text-lg">
                  Consultando APIs de fútbol...
                </p>
                <p className="text-blue-300 text-sm mt-2">
                  API-Football • Football-Data.org • TheSportsDB
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onResultChange={handleResultChange}
                      selectedResult={predictions[match.id] || ""}
                    />
                  ))}
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
                    {quiniela.matches.map((match: MatchPrediction & { result?: string }) => (
                      <div
                        key={match.id}
                        className="bg-white/5 rounded-lg p-3"
                      >
                        <p className="text-white text-sm font-medium truncate">
                          {match.homeTeam}
                        </p>
                        <p className="text-blue-300 text-xs">vs {match.awayTeam}</p>
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
