import os
import pickle

import numpy as np
from sklearn.ensemble import IsolationForest

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "fraud_model.pkl")


def train_isolation_forest() -> None:
    """
    Generate 10,000 synthetic claim records (85% normal, 15% fraudulent),
    train IsolationForest, and save to ml/models/fraud_model.pkl.

    Feature vector (8 features):
      [gps_quality, network_stability, motion_score, battery_state,
       app_interactions, claim_velocity, zone_claim_rate, platform_order_normal]
    """
    rng = np.random.default_rng(42)
    n_normal = 8500
    n_fraud = 1500

    # Normal claims: worker caught in a genuine disruption.
    # GPS degrades in storms, network is spotty, worker is moving around,
    # battery draining, app actively used.
    # zone_claim_rate can be high (0.0-0.40) during mass disruptions — that's expected.
    normal = np.column_stack([
        rng.uniform(0.25, 0.72, n_normal),                   # gps_quality
        rng.uniform(0.20, 0.65, n_normal),                   # network_stability
        rng.uniform(0.45, 0.92, n_normal),                   # motion_score
        rng.uniform(0.20, 0.75, n_normal),                   # battery_state (draining)
        rng.integers(5, 22, n_normal).astype(float),         # app_interactions
        rng.uniform(0.00, 0.40, n_normal),                   # claim_velocity (more lenient)
        rng.uniform(0.00, 0.40, n_normal),                   # zone_claim_rate (mass disruptions normal)
        rng.integers(0, 2, n_normal).astype(float),          # platform_order_normal
    ])

    # Fraudulent claims: worker is at home, not moving.
    # Suspiciously clean GPS, stable home WiFi, near-zero motion,
    # phone plugged in, barely using the app.
    fraud = np.column_stack([
        rng.uniform(0.85, 0.99, n_fraud),                    # gps_quality — too clean
        rng.uniform(0.88, 0.99, n_fraud),                    # network_stability — home WiFi
        rng.uniform(0.01, 0.10, n_fraud),                    # motion_score — not moving
        rng.uniform(0.85, 0.99, n_fraud),                    # battery_state — plugged in
        rng.integers(0, 3, n_fraud).astype(float),           # app_interactions — barely any
        rng.uniform(0.80, 1.00, n_fraud),                    # claim_velocity — near limit
        rng.uniform(0.20, 0.60, n_fraud),                    # zone_claim_rate — cluster
        rng.integers(1, 2, n_fraud).astype(float),           # platform showing normal orders
    ])

    X = np.vstack([normal, fraud])

    model = IsolationForest(
        contamination=0.15,
        n_estimators=100,
        random_state=42,
    )
    model.fit(X)

    os.makedirs(os.path.dirname(_MODEL_PATH), exist_ok=True)
    with open(_MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"IsolationForest trained on {len(X)} samples, saved to {_MODEL_PATH}")


def score_features(features: list) -> float:
    """
    Returns an anomaly score 0–100 (higher = more suspicious/fraudulent).
    Loads the pre-trained IsolationForest from ml/models/fraud_model.pkl.
    Falls back to a heuristic if the model file is missing.
    """
    try:
        with open(_MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        arr = np.array(features, dtype=float).reshape(1, -1)
        # decision_function returns values roughly in [-0.5, 0.5].
        # More negative = more anomalous (fraudulent).
        raw = model.decision_function(arr)[0]
        # Map to [0, 55]: model contributes up to 55 points.
        # Ring signal boosts (8 pts each) and simulate_fraud (+20) add on top.
        # This keeps normal claims (raw >= -0.1) below 30, leaving auto-approve headroom.
        score = max(0.0, min(55.0, (0.5 - raw) * 55.0))
        return round(score, 2)
    except Exception:
        # Heuristic fallback when model not yet trained.
        # Low motion + high GPS → suspicious.
        gps = features[0] if len(features) > 0 else 0.5
        motion = features[2] if len(features) > 2 else 0.5
        return round((1.0 - motion) * 50.0 + gps * 50.0, 2)
