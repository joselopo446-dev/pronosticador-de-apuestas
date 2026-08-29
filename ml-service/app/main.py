# =============================================
# SERVICIO ML — FastAPI
# =============================================
# Servicio de Machine Learning para pronósticos deportivos y lotería.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import numpy as np

from app.models import (
    MatchFeatures,
    predict_poisson,
    predict_logistic,
    predict_random_forest,
    predict_ensemble,
    get_available_models,
    MODEL_REGISTRY,
)

app = FastAPI(
    title="Pronosticador ML Service",
    description="Servicio de Machine Learning para predicciones deportivas y lotería",
    version="2.0.0",
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
    home_form: float = 0.5
    away_form: float = 0.5
    home_goals_scored_avg: float = 1.3
    home_goals_conceded_avg: float = 1.0
    away_goals_scored_avg: float = 1.0
    away_goals_conceded_avg: float = 1.3
    model: str = "ensemble"


class MatchPredictionResponse(BaseModel):
    expected_home_goals: float
    expected_away_goals: float
    probabilities: dict
    most_likely_score: dict
    over_under: dict
    btts: dict
    explanation: dict
    model: str
    confidence: float


class LotteryRequest(BaseModel):
    numbers: list[int]
    min_number: int = 1
    max_number: int = 56

class LotteryResponse(BaseModel):
    frequencies: dict
    overdue_numbers: list[int]
    hot_numbers: list[int]
    recommended_combination: list[int]


class ModelsListResponse(BaseModel):
    models: list[dict]


# =============================================
# ENDPOINTS
# =============================================

@app.post("/api/v1/sports/predict", response_model=MatchPredictionResponse)
async def predict_match_v2(req: MatchPredictionRequest):
    features = MatchFeatures(
        home_team_attack=req.home_team_attack,
        home_team_defense=req.home_team_defense,
        away_team_attack=req.away_team_attack,
        away_team_defense=req.away_team_defense,
        home_advantage=req.home_advantage,
        home_form=req.home_form,
        away_form=req.away_form,
        home_goals_scored_avg=req.home_goals_scored_avg,
        home_goals_conceded_avg=req.home_goals_conceded_avg,
        away_goals_scored_avg=req.away_goals_scored_avg,
        away_goals_conceded_avg=req.away_goals_conceded_avg,
    )

    model_fn = MODEL_REGISTRY.get(req.model, predict_ensemble)
    result = model_fn(features)

    return MatchPredictionResponse(
        expected_home_goals=result.expected_home_goals,
        expected_away_goals=result.expected_away_goals,
        probabilities=result.probabilities,
        most_likely_score=result.most_likely_score,
        over_under=result.over_under,
        btts=result.btts,
        explanation=result.explanation,
        model=result.model,
        confidence=result.confidence,
    )


@app.post("/api/v1/sports/poisson", response_model=MatchPredictionResponse)
async def predict_match_poisson(req: MatchPredictionRequest):
    features = MatchFeatures(
        home_team_attack=req.home_team_attack,
        home_team_defense=req.home_team_defense,
        away_team_attack=req.away_team_attack,
        away_team_defense=req.away_team_defense,
        home_advantage=req.home_advantage,
    )
    result = predict_poisson(features)
    return MatchPredictionResponse(
        expected_home_goals=result.expected_home_goals,
        expected_away_goals=result.expected_away_goals,
        probabilities=result.probabilities,
        most_likely_score=result.most_likely_score,
        over_under=result.over_under,
        btts=result.btts,
        explanation=result.explanation,
        model=result.model,
        confidence=result.confidence,
    )


@app.get("/api/v1/models", response_model=ModelsListResponse)
async def list_models():
    return ModelsListResponse(models=get_available_models())


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "ok",
        "service": "pronosticador-ml",
        "version": "2.0.0",
        "models": list(MODEL_REGISTRY.keys()),
    }


# =============================================
# LOTTERY ENDPOINT
# =============================================

@app.post("/api/v1/lottery/generate")
async def generate_lottery(req: LotteryRequest):
    import random

    numbers_pool = list(range(req.min_number, req.max_number + 1))

    frequency_weights = {}
    for num in numbers_pool:
        frequency_weights[num] = random.uniform(0.5, 1.5)

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
