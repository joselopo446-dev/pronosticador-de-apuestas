"""
Modelos de Machine Learning para predicciones deportivas.
Incluye: Poisson, Logistic Regression, Random Forest, Ensemble.
"""

import numpy as np
from math import factorial, exp
from dataclasses import dataclass
from typing import Optional
import json
import os


# =============================================
# DATA CLASSES
# =============================================

@dataclass
class MatchFeatures:
    home_attack: float
    home_defense: float
    away_attack: float
    away_defense: float
    home_advantage: float = 1.3
    home_form: float = 0.5  # últimos 5 partidos (0-1)
    away_form: float = 0.5
    home_goals_scored_avg: float = 1.3
    home_goals_conceded_avg: float = 1.0
    away_goals_scored_avg: float = 1.0
    away_goals_conceded_avg: float = 1.3


@dataclass
class PredictionResult:
    probabilities: dict
    expected_home_goals: float
    expected_away_goals: float
    most_likely_score: dict
    over_under: dict
    btts: dict
    explanation: dict
    model: str
    confidence: float = 0.0


# =============================================
# POISSON MODEL
# =============================================

def poisson_prob(lam: float, k: int) -> float:
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return (lam ** k * exp(-lam)) / factorial(k)


def predict_poisson(features: MatchFeatures) -> PredictionResult:
    avg_goals = 2.7
    exp_home = features.home_attack * features.away_defense * (avg_goals / 2) * features.home_advantage
    exp_away = features.away_attack * features.home_defense * (avg_goals / 2)

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
    if features.home_attack > 1.2:
        factors.append({"name": "Ataque local fuerte", "impact": "alto", "description": f"Factor {features.home_attack:.2f} por encima del promedio"})
    else:
        factors.append({"name": "Ataque local", "impact": "medio", "description": f"Factor {features.home_attack:.2f} promedio"})

    if features.away_defense < 0.8:
        factors.append({"name": "Defensa visitante sólida", "impact": "alto", "description": f"Factor {features.away_defense:.2f} muy sólida"})
    else:
        factors.append({"name": "Defensa visitante", "impact": "medio", "description": f"Factor {features.away_defense:.2f} estándar"})

    if features.home_form > 0.6:
        factors.append({"name": "Buena forma local", "impact": "alto", "description": f"{features.home_form*100:.0f}% rendimiento reciente"})

    if features.away_form < 0.4:
        factors.append({"name": "Mala forma visitante", "impact": "medio", "description": f"{features.away_form*100:.0f}% rendimiento reciente"})

    return PredictionResult(
        probabilities={"home_win": round(home_win, 4), "draw": round(draw, 4), "away_win": round(away_win, 4)},
        expected_home_goals=round(exp_home, 3),
        expected_away_goals=round(exp_away, 3),
        most_likely_score={"home": best_h, "away": best_a, "probability": round(best_p, 4)},
        over_under={"over25": round(over25, 4), "under25": round(1 - over25, 4)},
        btts={"yes": round(btts_yes, 4), "no": round(1 - btts_yes, 4)},
        explanation={"factors": factors, "summary": f"Goles esperados: {exp_home:.2f} vs {exp_away:.2f}. Victoria local: {home_win*100:.1f}%"},
        model="poisson-v1",
        confidence=0.7,
    )


# =============================================
# LOGISTIC REGRESSION (from scratch — no sklearn)
# =============================================

def sigmoid(z):
    z = np.clip(z, -500, 500)
    return 1 / (1 + np.exp(-z))


class LogisticRegressionModel:
    """Regresión logística multiclase (One-vs-Rest) implementada desde cero."""

    def __init__(self, n_features: int, n_classes: int = 3, lr: float = 0.01):
        self.weights = np.random.randn(n_classes, n_features) * 0.01
        self.biases = np.zeros(n_classes)
        self.lr = lr
        self.n_classes = n_classes
        self.trained = False

    def fit(self, X: np.ndarray, y: np.ndarray, epochs: int = 500):
        m = X.shape[0]
        for epoch in range(epochs):
            for c in range(self.n_classes):
                y_binary = (y == c).astype(float)
                z = X @ self.weights[c] + self.biases[c]
                preds = sigmoid(z)
                error = preds - y_binary
                grad_w = (X.T @ error) / m
                grad_b = np.mean(error)
                self.weights[c] -= self.lr * grad_w
                self.biases[c] -= self.lr * grad_b
        self.trained = True

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        logits = X @ self.weights.T + self.biases
        exp_logits = np.exp(logits - np.max(logits, axis=1, keepdims=True))
        return exp_logits / np.sum(exp_logits, axis=1, keepdims=True)

    def predict(self, X: np.ndarray) -> np.ndarray:
        proba = self.predict_proba(X)
        return np.argmax(proba, axis=1)


def features_to_array(features: MatchFeatures) -> np.ndarray:
    return np.array([
        features.home_attack,
        features.home_defense,
        features.away_attack,
        features.away_defense,
        features.home_advantage,
        features.home_form,
        features.away_form,
        features.home_goals_scored_avg,
        features.home_goals_conceded_avg,
        features.away_goals_scored_avg,
        features.away_goals_conceded_avg,
    ])


# Generate synthetic training data for logistic regression
def _generate_synthetic_data(n: int = 1000):
    np.random.seed(42)
    X = np.random.rand(n, 11) * 2  # 11 features, values 0-2
    # Synthetic labels based on attack/defense balance
    home_strength = X[:, 0] * X[:, 3] * X[:, 4]  # home_attack * away_defense * advantage
    away_strength = X[:, 2] * X[:, 1]  # away_attack * home_defense
    diff = home_strength - away_strength
    y = np.where(diff > 0.3, 0, np.where(diff < -0.3, 2, 1))  # 0=home, 1=draw, 2=away
    return X, y


# Train model once at import time
_lr_model = LogisticRegressionModel(n_features=11, n_classes=3, lr=0.05)
_X_train, _y_train = _generate_synthetic_data(2000)
_lr_model.fit(_X_train, _y_train, epochs=800)


def predict_logistic(features: MatchFeatures) -> PredictionResult:
    x = features_to_array(features).reshape(1, -1)
    proba = _lr_model.predict_proba(x)[0]

    exp_home = features.home_attack * features.away_defense * (2.7 / 2) * features.home_advantage
    exp_away = features.away_attack * features.home_defense * (2.7 / 2)

    max_goals = 6
    best_h, best_a, best_p = 0, 0, 0
    for h in range(max_goals + 1):
        for a in range(max_goals + 1):
            p = poisson_prob(exp_home, h) * poisson_prob(exp_away, a)
            if p > best_p:
                best_h, best_a, best_p = h, a, p

    over25 = sum(poisson_prob(exp_home, h) * poisson_prob(exp_away, a)
                 for h in range(max_goals + 1) for a in range(max_goals + 1) if h + a > 2.5)
    btts_yes = sum(poisson_prob(exp_home, h) * poisson_prob(exp_away, a)
                   for h in range(1, max_goals + 1) for a in range(1, max_goals + 1))

    factors = [
        {"name": "Modelo Logístico", "impact": "alto", "description": f"Entrenado con {len(_X_train)} muestras sintéticas"},
        {"name": "Probabilidades calculadas", "impact": "alto", "description": f"Local {proba[0]*100:.1f}% | Empate {proba[1]*100:.1f}% | Visitante {proba[2]*100:.1f}%"},
    ]

    if features.home_form > 0.6:
        factors.append({"name": "Forma local positiva", "impact": "medio", "description": f"Rendimiento reciente {features.home_form*100:.0f}%"})

    return PredictionResult(
        probabilities={"home_win": round(float(proba[0]), 4), "draw": round(float(proba[1]), 4), "away_win": round(float(proba[2]), 4)},
        expected_home_goals=round(exp_home, 3),
        expected_away_goals=round(exp_away, 3),
        most_likely_score={"home": best_h, "away": best_a, "probability": round(best_p, 4)},
        over_under={"over25": round(over25, 4), "under25": round(1 - over25, 4)},
        btts={"yes": round(btts_yes, 4), "no": round(1 - btts_yes, 4)},
        explanation={"factors": factors, "summary": f"Regresión Logística: Local {proba[0]*100:.1f}% | Empate {proba[1]*100:.1f}% | Visitante {proba[2]*100:.1f}%"},
        model="logistic-regression-v1",
        confidence=0.65,
    )


# =============================================
# RANDOM FOREST (simplified — from scratch)
# =============================================

class DecisionStump:
    """Stump de decisión simple (un solo split)."""

    def __init__(self):
        self.feature_idx = 0
        self.threshold = 0.5
        self.left_value = 0
        self.right_value = 0

    def fit(self, X: np.ndarray, y: np.ndarray, sample_weights: Optional[np.ndarray] = None):
        m, n = X.shape
        best_gini = float("inf")

        for feature in range(n):
            thresholds = np.unique(X[:, feature])
            for t in thresholds:
                left_mask = X[:, feature] <= t
                right_mask = ~left_mask
                if np.sum(left_mask) == 0 or np.sum(right_mask) == 0:
                    continue

                y_left = y[left_mask]
                y_right = y[right_mask]

                def gini(labels):
                    if len(labels) == 0:
                        return 0
                    _, counts = np.unique(labels, return_counts=True)
                    probs = counts / len(labels)
                    return 1 - np.sum(probs ** 2)

                w_left = np.sum(left_mask) / m
                w_right = np.sum(right_mask) / m
                gini_split = w_left * gini(y_left) + w_right * gini(y_right)

                if gini_split < best_gini:
                    best_gini = gini_split
                    self.feature_idx = feature
                    self.threshold = t
                    _, left_counts = np.unique(y_left, return_counts=True)
                    _, right_counts = np.unique(y_right, return_counts=True)
                    self.left_value = np.argmax(left_counts)
                    self.right_value = np.argmax(right_counts)

    def predict(self, X: np.ndarray) -> np.ndarray:
        return np.where(X[:, self.feature_idx] <= self.threshold, self.left_value, self.right_value)


class RandomForestModel:
    """Random Forest simplificado para clasificación multiclase."""

    def __init__(self, n_trees: int = 20, max_features: int = 5):
        self.n_trees = n_trees
        self.max_features = max_features
        self.trees: list[DecisionStump] = []
        self.trained = False

    def fit(self, X: np.ndarray, y: np.ndarray):
        m, n = X.shape
        self.trees = []

        for _ in range(self.n_trees):
            # Bootstrap sample
            indices = np.random.choice(m, size=m, replace=True)
            X_boot = X[indices]
            y_boot = y[indices]

            # Random feature subset
            feature_indices = np.random.choice(n, size=min(self.max_features, n), replace=False)
            X_sub = X_boot[:, feature_indices]

            stump = DecisionStump()
            stump.fit(X_sub, y_boot)
            # Store feature mapping
            stump._feature_map = feature_indices
            self.trees.append(stump)

        self.trained = True

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        m = X.shape[0]
        n_classes = 3
        votes = np.zeros((m, n_classes))

        for tree in self.trees:
            X_sub = X[:, tree._feature_map]
            preds = tree.predict(X_sub)
            for i, p in enumerate(preds):
                votes[i, int(p)] += 1

        return votes / self.n_trees

    def predict(self, X: np.ndarray) -> np.ndarray:
        proba = self.predict_proba(X)
        return np.argmax(proba, axis=1)


# Train Random Forest at import time
_rf_model = RandomForestModel(n_trees=30, max_features=6)
_rf_model.fit(_X_train, _y_train)


def predict_random_forest(features: MatchFeatures) -> PredictionResult:
    x = features_to_array(features).reshape(1, -1)
    proba = _rf_model.predict_proba(x)[0]

    exp_home = features.home_attack * features.away_defense * (2.7 / 2) * features.home_advantage
    exp_away = features.away_attack * features.home_defense * (2.7 / 2)

    max_goals = 6
    best_h, best_a, best_p = 0, 0, 0
    for h in range(max_goals + 1):
        for a in range(max_goals + 1):
            p = poisson_prob(exp_home, h) * poisson_prob(exp_away, a)
            if p > best_p:
                best_h, best_a, best_p = h, a, p

    over25 = sum(poisson_prob(exp_home, h) * poisson_prob(exp_away, a)
                 for h in range(max_goals + 1) for a in range(max_goals + 1) if h + a > 2.5)
    btts_yes = sum(poisson_prob(exp_home, h) * poisson_prob(exp_away, a)
                   for h in range(1, max_goals + 1) for a in range(1, max_goals + 1))

    factors = [
        {"name": "Random Forest", "impact": "alto", "description": f"{_rf_model.n_trees} árboles de decisión"},
        {"name": "Conjunto de entrenamiento", "impact": "alto", "description": f"{len(_X_train)} muestras sintéticas"},
        {"name": "Probabilidades", "impact": "alto", "description": f"Local {proba[0]*100:.1f}% | Empate {proba[1]*100:.1f}% | Visitante {proba[2]*100:.1f}%"},
    ]

    return PredictionResult(
        probabilities={"home_win": round(float(proba[0]), 4), "draw": round(float(proba[1]), 4), "away_win": round(float(proba[2]), 4)},
        expected_home_goals=round(exp_home, 3),
        expected_away_goals=round(exp_away, 3),
        most_likely_score={"home": best_h, "away": best_a, "probability": round(best_p, 4)},
        over_under={"over25": round(over25, 4), "under25": round(1 - over25, 4)},
        btts={"yes": round(btts_yes, 4), "no": round(1 - btts_yes, 4)},
        explanation={"factors": factors, "summary": f"Random Forest: Local {proba[0]*100:.1f}% | Empate {proba[1]*100:.1f}% | Visitante {proba[2]*100:.1f}%"},
        model="random-forest-v1",
        confidence=0.72,
    )


# =============================================
# ENSEMBLE MODEL
# =============================================

def predict_ensemble(features: MatchFeatures) -> PredictionResult:
    """Combina Poisson + Logistic Regression + Random Forest con pesos ponderados."""
    p_poisson = predict_poisson(features)
    p_logistic = predict_logistic(features)
    p_rf = predict_random_forest(features)

    # Pesos del ensemble (ponderado por confianza)
    weights = {
        "poisson": p_poisson.confidence,
        "logistic": p_logistic.confidence,
        "rf": p_rf.confidence,
    }
    total_weight = sum(weights.values())

    combined_probs = {
        "home_win": round(
            (p_poisson.probabilities["home_win"] * weights["poisson"] +
             p_logistic.probabilities["home_win"] * weights["logistic"] +
             p_rf.probabilities["home_win"] * weights["rf"]) / total_weight, 4
        ),
        "draw": round(
            (p_poisson.probabilities["draw"] * weights["poisson"] +
             p_logistic.probabilities["draw"] * weights["logistic"] +
             p_rf.probabilities["draw"] * weights["rf"]) / total_weight, 4
        ),
        "away_win": round(
            (p_poisson.probabilities["away_win"] * weights["poisson"] +
             p_logistic.probabilities["away_win"] * weights["logistic"] +
             p_rf.probabilities["away_win"] * weights["rf"]) / total_weight, 4
        ),
    }

    exp_home = (p_poisson.expected_home_goals + p_logistic.expected_home_goals + p_rf.expected_home_goals) / 3
    exp_away = (p_poisson.expected_away_goals + p_logistic.expected_away_goals + p_rf.expected_away_goals) / 3

    over25 = (p_poisson.over_under["over25"] + p_logistic.over_under["over25"] + p_rf.over_under["over25"]) / 3
    btts = (p_poisson.btts["yes"] + p_logistic.btts["yes"] + p_rf.btts["yes"]) / 3

    factors = [
        {"name": "Ensemble (3 modelos)", "impact": "muy alto", "description": "Combina Poisson + Logístico + Random Forest"},
        {"name": "Ponderación por confianza", "impact": "alto", "description": f"Pesos: Poisson {weights['poisson']:.0%}, Logístico {weights['logistic']:.0%}, RF {weights['rf']:.0%}"},
        {"name": "Goles esperados", "impact": "alto", "description": f"Local {exp_home:.2f} | Visitante {exp_away:.2f}"},
    ]

    best_h, best_a = p_poisson.most_likely_score["home"], p_poisson.most_likely_score["away"]

    return PredictionResult(
        probabilities=combined_probs,
        expected_home_goals=round(exp_home, 3),
        expected_away_goals=round(exp_away, 3),
        most_likely_score={"home": best_h, "away": best_a, "probability": round(p_poisson.most_likely_score["probability"], 4)},
        over_under={"over25": round(over25, 4), "under25": round(1 - over25, 4)},
        btts={"yes": round(btts, 4), "no": round(1 - btts, 4)},
        explanation={"factors": factors, "summary": f"Ensemble: Local {combined_probs['home_win']*100:.1f}% | Empate {combined_probs['draw']*100:.1f}% | Visitante {combined_probs['away_win']*100:.1f}%"},
        model="ensemble-v1",
        confidence=0.78,
    )


# =============================================
# MODEL REGISTRY
# =============================================

MODEL_REGISTRY = {
    "poisson": predict_poisson,
    "logistic-regression": predict_logistic,
    "random-forest": predict_random_forest,
    "ensemble": predict_ensemble,
}

def get_available_models() -> list[dict]:
    return [
        {"id": "poisson", "name": "Distribución de Poisson", "description": "Modelo clásico de goles esperados", "confidence": 0.70},
        {"id": "logistic-regression", "name": "Regresión Logística", "description": "Clasificación multiclase con features de equipo", "confidence": 0.65},
        {"id": "random-forest", "name": "Random Forest", "description": "Ensamble de árboles de decisión", "confidence": 0.72},
        {"id": "ensemble", "name": "Ensemble (3 modelos)", "description": "Combinación ponderada de los 3 modelos", "confidence": 0.78},
    ]
