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

interface Prediction {
  homeWin: number;
  draw: number;
  awayWin: number;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  mostLikelyScore: { home: number; away: number; probability: number };
  confidence: number;
}

interface MatchPrediction {
  fixture: Fixture;
  prediction: Prediction;
  homeForm: string;
  awayForm: string;
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

const TEAM_RATINGS: Record<string, { attack: number; defense: number; form: string }> = {
  "América": { attack: 1.5, defense: 0.8, form: "WWDLW" },
  "Cruz Azul": { attack: 1.3, defense: 0.9, form: "WDWWL" },
  "Guadalajara": { attack: 1.15, defense: 1.0, form: "LWWWD" },
  "Pumas UNAM": { attack: 1.1, defense: 1.05, form: "WDLWW" },
  "Tigres UANL": { attack: 1.4, defense: 0.85, form: "WWWDW" },
  "Monterrey": { attack: 1.35, defense: 0.9, form: "WDWWL" },
  "León": { attack: 1.2, defense: 1.0, form: "DLWWW" },
  "Santos Laguna": { attack: 1.05, defense: 1.15, form: "LWDLW" },
  "Atlas": { attack: 0.95, defense: 1.1, form: "DLLWW" },
  "Pachuca": { attack: 1.1, defense: 1.0, form: "WWLDL" },
  "Toluca": { attack: 1.15, defense: 1.05, form: "DWWLW" },
  "Necaxa": { attack: 0.9, defense: 1.2, form: "LDLWW" },
  "Mazatlán": { attack: 0.95, defense: 1.15, form: "WLDWL" },
  "Puebla": { attack: 0.85, defense: 1.25, form: "LLDWW" },
  "Juárez": { attack: 0.85, defense: 1.25, form: "DLLWL" },
  "San Luis": { attack: 0.9, defense: 1.2, form: "LWWDL" },
  "Real Madrid": { attack: 1.6, defense: 0.7, form: "WWWWW" },
  "FC Barcelona": { attack: 1.5, defense: 0.8, form: "WWWWD" },
  "Atlético Madrid": { attack: 1.3, defense: 0.85, form: "WDWWD" },
  "Sevilla FC": { attack: 1.05, defense: 1.0, form: "DLWWD" },
  "Real Sociedad": { attack: 1.15, defense: 0.9, form: "WWLDW" },
  "Villarreal": { attack: 1.2, defense: 0.95, form: "WDWWL" },
  "Athletic Club": { attack: 1.1, defense: 0.9, form: "WWWLD" },
  "Valencia CF": { attack: 1.0, defense: 1.05, form: "DLWWL" },
  "Real Betis": { attack: 1.1, defense: 1.0, form: "WWDWL" },
  "CA Osasuna": { attack: 1.0, defense: 1.05, form: "LDWWD" },
  "RC Celta de Vigo": { attack: 1.05, defense: 1.0, form: "WWDLL" },
  "Getafe CF": { attack: 0.85, defense: 0.95, form: "DDLWW" },
  "Rayo Vallecano": { attack: 0.95, defense: 1.0, form: "LWWDL" },
  "Manchester City": { attack: 1.6, defense: 0.7, form: "WWWWW" },
  "Arsenal": { attack: 1.5, defense: 0.75, form: "WWWDW" },
  "Liverpool": { attack: 1.45, defense: 0.8, form: "WWWWD" },
  "Manchester United": { attack: 1.2, defense: 1.0, form: "WDWLL" },
  "Chelsea": { attack: 1.25, defense: 0.9, form: "WWDWL" },
  "Tottenham Hotspur": { attack: 1.3, defense: 0.95, form: "WWLDW" },
  "Newcastle United": { attack: 1.2, defense: 0.85, form: "WDWWL" },
  "Aston Villa": { attack: 1.15, defense: 0.9, form: "WWDWL" },
  "Brighton": { attack: 1.1, defense: 0.95, form: "DLWWD" },
  "West Ham United": { attack: 1.05, defense: 1.0, form: "LWWDL" },
  "Brentford": { attack: 1.0, defense: 1.05, form: "WLDWW" },
  "Fulham": { attack: 1.0, defense: 1.0, form: "DLWWD" },
  "Crystal Palace": { attack: 0.95, defense: 1.0, form: "LLDWW" },
  "Wolves": { attack: 0.9, defense: 1.1, form: "LDLWL" },
  "Bournemouth": { attack: 0.95, defense: 1.05, form: "WWLDL" },
  "Everton": { attack: 0.85, defense: 1.15, form: "DLLWL" },
  "Real Racing Club de Santander": { attack: 0.9, defense: 1.1, form: "LDLWW" },
  "RC Deportivo La Coruña": { attack: 0.85, defense: 1.15, form: "LLDWW" },
  "Málaga CF": { attack: 0.8, defense: 1.2, form: "DLLWL" },
};

function getTeamRating(name: string) {
  if (TEAM_RATINGS[name]) return TEAM_RATINGS[name];
  for (const [key, val] of Object.entries(TEAM_RATINGS)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
      return val;
    }
  }
  return { attack: 1.0, defense: 1.0, form: "" };
}

function calculatePrediction(home: string, away: string): Prediction {
  const h = getTeamRating(home);
  const a = getTeamRating(away);

  const homeAttack = h.attack;
  const homeDefense = h.defense;
  const awayAttack = a.attack;
  const awayDefense = a.defense;

  const strengthDiff = (homeAttack - awayAttack) + (awayDefense - homeDefense);
  const homeAdvantage = 0.08;

  const homeWinRaw = 0.42 + strengthDiff * 0.22 + homeAdvantage;
  const awayWinRaw = 0.28 - strengthDiff * 0.18;

  const homeWin = Math.min(0.75, Math.max(0.18, homeWinRaw));
  const awayWin = Math.min(0.65, Math.max(0.12, awayWinRaw));
  const draw = Math.max(0.15, Math.min(0.35, 1 - homeWin - awayWin));

  const totalGoals = 1.3 + (homeAttack + awayAttack) * 0.35;
  const homeGoals = totalGoals * (0.5 + (homeAttack - awayAttack) * 0.05);
  const awayGoals = totalGoals - homeGoals;

  const bestProb = Math.max(homeWin, draw, awayWin);
  let likelyH = 1, likelyA = 1;
  if (homeWin === bestProb) { likelyH = 2; likelyA = 1; }
  else if (awayWin === bestProb) { likelyH = 0; likelyA = 2; }
  else { likelyH = 1; likelyA = 1; }

  return {
    homeWin,
    draw,
    awayWin,
    expectedHomeGoals: homeGoals,
    expectedAwayGoals: awayGoals,
    mostLikelyScore: { home: likelyH, away: likelyA, probability: bestProb },
    confidence: 0.68 + Math.abs(strengthDiff) * 0.12,
  };
}

function ResultBadge({ result }: { result: string }) {
  const colors: Record<string, string> = { "1": "bg-green-600", "X": "bg-yellow-500", "2": "bg-red-600" };
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${colors[result] || "bg-gray-400"}`}>
      {result}
    </span>
  );
}

function FormDisplay({ form }: { form: string }) {
  if (!form) return <span className="text-gray-500 text-xs">-</span>;
  return (
    <div className="flex gap-0.5">
      {form.slice(-5).split("").map((r, i) => (
        <span key={i} className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${
          r === "W" ? "bg-green-600 text-white" : r === "D" ? "bg-yellow-500 text-white" : "bg-red-600 text-white"
        }`}>{r}</span>
      ))}
    </div>
  );
}

function MatchCard({ match, onToggle, selected }: {
  match: MatchPrediction;
  onToggle: (id: number, result: string) => void;
  selected: string;
}) {
  const { fixture, prediction, homeForm, awayForm } = match;
  const leagueCfg = LEAGUES.find(l => l.id === fixture.leagueId);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className={`bg-gradient-to-r ${leagueCfg?.color || "from-gray-600 to-gray-800"} text-white px-4 py-2 flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{fixture.league}</span>
          {fixture.matchday > 0 && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Jornada {fixture.matchday}</span>}
        </div>
        <span className="text-xs opacity-80">
          {new Date(fixture.date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 text-center">
            <div className="flex justify-center mb-2">
              {fixture.homeTeamLogo
                ? <img src={fixture.homeTeamLogo} alt="" className="w-12 h-12 object-contain" />
                : <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg">⚽</div>}
            </div>
            <p className="font-bold text-gray-800 text-sm">{fixture.homeTeam}</p>
            <div className="mt-1"><FormDisplay form={homeForm} /></div>
          </div>
          <div className="mx-4 flex flex-col items-center">
            <span className="text-xs text-gray-400 mb-1">VS</span>
            <div className="bg-gray-100 rounded-lg px-3 py-1">
              <span className="text-sm font-bold text-gray-700">
                {prediction.expectedHomeGoals.toFixed(1)} - {prediction.expectedAwayGoals.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="flex justify-center mb-2">
              {fixture.awayTeamLogo
                ? <img src={fixture.awayTeamLogo} alt="" className="w-12 h-12 object-contain" />
                : <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg">⚽</div>}
            </div>
            <p className="font-bold text-gray-800 text-sm">{fixture.awayTeam}</p>
            <div className="mt-1"><FormDisplay form={awayForm} /></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button onClick={() => onToggle(fixture.id, "1")}
            className={`py-2 rounded-lg font-bold transition-all ${selected === "1" ? "bg-green-600 text-white shadow-lg scale-105" : "bg-green-100 text-green-800 hover:bg-green-200"}`}>
            1 (Local)<span className="block text-xs font-normal">{(prediction.homeWin * 100).toFixed(0)}%</span>
          </button>
          <button onClick={() => onToggle(fixture.id, "X")}
            className={`py-2 rounded-lg font-bold transition-all ${selected === "X" ? "bg-yellow-500 text-white shadow-lg scale-105" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"}`}>
            X (Empate)<span className="block text-xs font-normal">{(prediction.draw * 100).toFixed(0)}%</span>
          </button>
          <button onClick={() => onToggle(fixture.id, "2")}
            className={`py-2 rounded-lg font-bold transition-all ${selected === "2" ? "bg-red-600 text-white shadow-lg scale-105" : "bg-red-100 text-red-800 hover:bg-red-200"}`}>
            2 (Visitante)<span className="block text-xs font-normal">{(prediction.awayWin * 100).toFixed(0)}%</span>
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-500 flex justify-between">
          <span>Más probable: {prediction.mostLikelyScore.home} - {prediction.mostLikelyScore.away}</span>
          <span className="font-medium text-blue-600">{(prediction.confidence * 100).toFixed(0)}% confianza</span>
        </div>
      </div>
    </div>
  );
}

export default function QuinielasPage() {
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [matches, setMatches] = useState<MatchPrediction[]>([]);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [quinielas, setQuinielas] = useState<Quiniela[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");

  const fetchAndPredict = async (leagueId: number | null) => {
    setLoading(true);
    try {
      const url = leagueId ? `/api/fixtures?league=${leagueId}` : "/api/fixtures?league=all";
      const res = await fetch(url);
      const data = await res.json();

      if (!data.success || !data.fixtures?.length) {
        setMatches([]);
        return;
      }

      const predicted: MatchPrediction[] = data.fixtures.map((f: Fixture) => {
        const pred = calculatePrediction(f.homeTeam, f.awayTeam);
        const h = getTeamRating(f.homeTeam);
        const a = getTeamRating(f.awayTeam);
        return {
          fixture: f,
          prediction: pred,
          homeForm: h.form,
          awayForm: a.form,
        };
      });

      setMatches(predicted);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndPredict(selectedLeague);
  }, [selectedLeague]);

  const toggle = (id: number, result: string) => {
    setSelections(prev => ({ ...prev, [id]: prev[id] === result ? "" : result }));
  };

  const save = () => {
    const selected = matches.filter(m => selections[m.fixture.id]);
    if (!selected.length) return;
    const leagueName = selectedLeague ? LEAGUES.find(l => l.id === selectedLeague)?.name : "Todas";
    const q: Quiniela = {
      id: Date.now().toString(),
      name: `Quiniela ${leagueName}`,
      league: leagueName || "",
      matches: selected.map(m => ({ ...m, result: selections[m.fixture.id] })),
      createdAt: new Date().toISOString(),
      potentialWin: `$${(selected.length * 1500).toLocaleString()}`,
    };
    setQuinielas(prev => [q, ...prev]);
    setSelections({});
    setActiveTab("saved");
  };

  const total = Object.values(selections).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎯 Quinielas Deportivas</h1>
          <p className="text-blue-200">Partidos REALES del calendario oficial</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setActiveTab("generate")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === "generate" ? "bg-blue-600 text-white shadow-lg" : "bg-white/10 text-white hover:bg-white/20"}`}>
            🆕 Generar Quiniela
          </button>
          <button onClick={() => setActiveTab("saved")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === "saved" ? "bg-green-600 text-white shadow-lg" : "bg-white/10 text-white hover:bg-white/20"}`}>
            📋 Guardadas ({quinielas.length})
          </button>
        </div>

        {activeTab === "generate" && (
          <>
            <div className="flex justify-center gap-3 mb-8">
              <button onClick={() => setSelectedLeague(null)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${selectedLeague === null ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl scale-105" : "bg-white/10 text-white hover:bg-white/20"}`}>
                🌐 Todas
              </button>
              {LEAGUES.map(l => (
                <button key={l.id} onClick={() => setSelectedLeague(l.id)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${selectedLeague === l.id ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl scale-105" : "bg-white/10 text-white hover:bg-white/20"}`}>
                  {l.flag} {l.name}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-white text-lg">Cargando partidos del calendario...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-20 text-white/60">
                <p className="text-4xl mb-4">📅</p>
                <p className="text-lg">No hay partidos programados próximamente</p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <p className="text-blue-200 text-sm">{matches.length} partidos del calendario oficial</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {matches.map(m => (
                    <MatchCard key={m.fixture.id} match={m} onToggle={toggle} selected={selections[m.fixture.id] || ""} />
                  ))}
                </div>
                {total > 0 && (
                  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50">
                    <div>
                      <p className="font-bold text-lg">{total} selecciones</p>
                      <p className="text-green-200 text-sm">Ganancia: ${(total * 1500).toLocaleString()}</p>
                    </div>
                    <button onClick={save} className="bg-white text-green-700 px-6 py-2 rounded-xl font-bold hover:bg-green-50 transition-colors">
                      💾 Guardar
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
              </div>
            ) : quinielas.map(q => (
              <div key={q.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{q.name}</h3>
                    <p className="text-blue-200 text-sm">{new Date(q.createdAt).toLocaleString("es-MX")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-lg">{q.potentialWin}</p>
                    <p className="text-blue-200 text-xs">Ganancia potencial</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {q.matches.map(m => (
                    <div key={m.fixture.id} className="bg-white/5 rounded-lg p-3">
                      <p className="text-white text-sm font-medium truncate">{m.fixture.homeTeam}</p>
                      <p className="text-blue-300 text-xs">vs {m.fixture.awayTeam}</p>
                      <div className="mt-2"><ResultBadge result={m.result || ""} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
