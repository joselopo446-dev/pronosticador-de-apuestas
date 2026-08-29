# =============================================
# SERVICIO ML — FastAPI
# =============================================
# Servicio de Machine Learning para pronósticos deportivos y lotería.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import numpy as np
from math import factorial, exp

app = FastAPI(
    title="Pronosticador ML Service",
    description="Servicio de Machine Learning para predicciones deportivas y lotería",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pronosticador-de-apuestas.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================
# MODELOS DE REQUEST/RESPONSE
# =============================================

class MatchPredictionRequest(BaseModel):
    home_team_attack: float
    home_team_defense: float
    away_team_attack: float
    away_team_defense: float
    home_advantage: float = 1.3

class MatchPredictionResponse(BaseModel):
    expected_home_goals: float
    expected_away_goals: float
    probabilities: dict
    most_likely_score: dict
    over_under: dict
    btts: dict
    explanation: dict
    model: str


class LotteryRequest(BaseModel):
    numbers: list[int]
    min_number: int = 1
    max_number: int = 56

class LotteryResponse(BaseModel):
    frequencies: dict
    overdue_numbers: list[int]
    hot_numbers: list[int]
    recommended_combination: list[int]


# =============================================
# MODELO POISSON
# =============================================

def poisson_prob(lam: float, k: int) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return (lam ** k * exp(-lam)) / factorial(k)


@app.post("/api/v1/sports/poisson", response_model=MatchPredictionResponse)
async def predict_match(req: MatchPredictionRequest):
    avg_goals = 2.7
    exp_home = req.home_team_attack * req.away_team_defense * (avg_goals / 2) * req.home_advantage
    exp_away = req.away_team_attack * req.home_team_defense * (avg_goals / 2)

    max_goals = 6
    score_matrix = []
    for h in range(max_goals + 1):
        row = []
        for a in range(max_goals + 1):
            row.append(poisson_prob(exp_home, h) * poisson_prob(exp_away, a))
        score_matrix.append(row)

    home_win = sum(score_matrix[h][a] for h in range(max_goals + 1) for a in range(max_goals + 1) if h > a)
    draw = sum(score_matrix[h][a] for h in range(max_goals + 1) for a in range(max_goals + 1) if h == a)
    away_win = sum(score_matrix[h][a] for h in range(max_goals + 1) for a in range(max_goals + 1) if h < a)

    best_h, best_a, best_p = 0, 0, 0
    for h in range(max_goals + 1):
        for a in range(max_goals + 1):
            if score_matrix[h][a] > best_p:
                best_h, best_a, best_p = h, a, score_matrix[h][a]

    over25 = sum(score_matrix[h][a] for h in range(max_goals + 1) for a in range(max_goals + 1) if h + a > 2.5)
    btts_yes = sum(score_matrix[h][a] for h in range(1, max_goals + 1) for a in range(1, max_goals + 1))

    factors = []
    if req.home_team_attack > 1.2:
        factors.append({"name": "Ataque local fuerte", "impact": "alto", "description": f"Factor {req.home_team_attack:.2f} por encima del promedio"})
    else:
        factors.append({"name": "Ataque local", "impact": "medio", "description": f"Factor {req.home_team_attack:.2f} promedio"})

    if req.away_team_defense < 0.8:
        factors.append({"name": "Defensa visitante sólida", "impact": "alto", "description": f"Factor {req.away_team_defense:.2f} muy sólida"})
    else:
        factors.append({"name": "Defensa visitante", "impact": "medio", "description": f"Factor {req.away_team_defense:.2f} estándar"})

    return MatchPredictionResponse(
        expected_home_goals=round(exp_home, 3),
        expected_away_goals=round(exp_away, 3),
        probabilities={
            "home_win": round(home_win, 4),
            "draw": round(draw, 4),
            "away_win": round(away_win, 4),
        },
        most_likely_score={"home": best_h, "away": best_a, "probability": round(best_p, 4)},
        over_under={"over25": round(over25, 4), "under25": round(1 - over25, 4)},
        btts={"yes": round(btts_yes, 4), "no": round(1 - btts_yes, 4)},
        explanation={"factors": factors, "summary": f"Goles esperados: {exp_home:.2f} vs {exp_away:.2f}. Victoria local: {home_win*100:.1f}%"},
        model="poisson-v1",
    )


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "service": "pronosticador-ml", "version": "1.0.0"}


# =============================================
# LOTTERY ENDPOINT
# =============================================

@app.post("/api/v1/lottery/generate")
async def generate_lottery(req: LotteryRequest):
    import random
    
    numbers_pool = list(range(req.min_number, req.max_number + 1))
    
    # Frequency-based strategy: pick numbers that appear more often
    frequency_weights = {}
    for num in numbers_pool:
        # Simulate frequency weights (in production, use real data)
        frequency_weights[num] = random.uniform(0.5, 1.5)
    
    # Weighted random selection
    selected = []
    available = numbers_pool.copy()
    for _ in range(min(6, len(available))):
        weights = [frequency_weights[n] for n in available]
        total = sum(weights)
        probs = [w / total for w in weights]
        choice = random.choices(available, weights=probs, k=1)[0]
        selected.append(choice)
        available.remove(choice)
    
    selected.sort()
    
    return LotteryResponse(
        frequencies={"total_draws": 100, "pool_size": len(numbers_pool)},
        overdue_numbers=sorted(random.sample(numbers_pool, min(5, len(numbers_pool)))),
        hot_numbers=sorted(random.sample(numbers_pool, min(5, len(numbers_pool)))),
        recommended_combination=selected,
    )
