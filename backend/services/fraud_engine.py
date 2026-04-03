import random
import sys
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from config import settings
from models.claim import Claim
from models.disruption import Disruption
from models.policy import Policy
from models.worker import Worker

# Ensure ml/ is importable from services/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@dataclass
class FraudResult:
    bas_score: float           # 0-100; higher = more authentic worker behaviour
    fraud_score: float         # 0-100; higher = more suspicious
    ring_signals: list = field(default_factory=list)  # list of signal name strings
    fraud_flags: list = field(default_factory=list)   # list of {signal, detail} dicts
    recommendation: str = "approve"                   # approve | manual_review | reject


# -- BAS helpers --------------------------------------------------------------

def _mock_telemetry(simulate_fraud: bool) -> dict:
    """Generate realistic mock device telemetry for a worker during a disruption."""
    if simulate_fraud:
        # Suspiciously clean: worker is at home pretending to be outside
        return {
            "gps_quality": random.uniform(0.85, 0.98),
            "network_stability": random.uniform(0.88, 0.99),
            "motion_score": random.uniform(0.02, 0.10),
            "battery_state": random.uniform(0.85, 0.99),
            "app_interactions": random.randint(0, 2),
        }
    # Normal: heavily degraded signals consistent with a real disruption.
    # Rain/storms: GPS drops sharply, cell towers get overloaded (bad network),
    # worker is actively moving (trying to complete deliveries), battery drains fast.
    return {
        "gps_quality": random.uniform(0.25, 0.60),
        "network_stability": random.uniform(0.20, 0.50),
        "motion_score": random.uniform(0.65, 0.90),
        "battery_state": random.uniform(0.20, 0.60),
        "app_interactions": random.randint(10, 20),
    }


def _compute_bas(t: dict) -> float:
    """
    Compute Behavioural Authenticity Score (0-100).
    High GPS quality + stable network + low motion = suspicious -> low BAS.
    Degraded GPS + spotty network + active motion = genuine -> high BAS.
    Weights: motion (0.35) is the primary discriminator — genuine workers move.
    """
    authenticity = (
        (1 - t["gps_quality"]) * 0.25
        + (1 - t["network_stability"]) * 0.25
        + t["motion_score"] * 0.35
        + (1 - t["battery_state"]) * 0.10
        + min(t["app_interactions"], 20) / 20 * 0.05
    )
    return round(authenticity * 100, 2)


# -- Syndicate signal detectors -----------------------------------------------

def _signal_temporal_clustering(
    worker: Worker, disruption: Disruption, db: Session
) -> tuple:
    """Flag if > 15% of workers in the city filed claims in the last 4 minutes."""
    cutoff = datetime.utcnow() - timedelta(minutes=4)
    recent_count = (
        db.query(Claim)
        .filter(
            Claim.disruption_id == disruption.id,
            Claim.created_at >= cutoff,
        )
        .count()
    )
    total_workers = (
        db.query(Worker).filter(Worker.city == disruption.city).count()
    )
    if total_workers > 0 and (recent_count / total_workers) > 0.15:
        return True, (
            f"{recent_count} claims filed in last 4 min across {disruption.city} "
            f"({recent_count}/{total_workers} workers = "
            f"{recent_count/total_workers*100:.0f}%) -- possible coordinated fraud"
        )
    return False, ""


def _signal_platform_order_inversion(
    worker: Worker, disruption: Disruption
) -> tuple:
    """Flag if platform shows normal order flow during a severe/extreme disruption."""
    if disruption.severity not in ("severe", "extreme"):
        return False, ""
    from integrations.platform_mock import get_zone_order_rate
    data = get_zone_order_rate(disruption.city)
    if data.get("order_rate_normal"):
        return True, (
            f"Platform order rate normal in {disruption.city} despite "
            f"{disruption.severity} {disruption.type} disruption -- "
            "orders flowing normally suggests disruption may not be impacting workers"
        )
    return False, ""


def _signal_velocity_anomaly(
    worker: Worker, policy: Policy, db: Session
) -> tuple:
    """Flag if worker already used >= max_days_per_week claims in the last 7 days."""
    cutoff = datetime.utcnow() - timedelta(days=7)
    recent = (
        db.query(Claim)
        .filter(
            Claim.worker_id == worker.id,
            Claim.created_at >= cutoff,
            Claim.status != "rejected",
        )
        .count()
    )
    if recent >= int(policy.max_days_per_week):
        return True, (
            f"Worker filed {recent} claims in last 7 days "
            f"(policy max: {policy.max_days_per_week}/week) -- velocity limit reached"
        )
    return False, ""


def _signal_cohort_registration_burst(
    worker: Worker, db: Session
) -> tuple:
    """Flag if >= 5 workers registered within +-24h of this worker (bulk sign-up pattern)."""
    window_start = worker.created_at - timedelta(hours=24)
    window_end = worker.created_at + timedelta(hours=24)
    cohort_count = (
        db.query(Worker)
        .filter(
            Worker.created_at >= window_start,
            Worker.created_at <= window_end,
            Worker.id != worker.id,
        )
        .count()
    )
    if cohort_count >= 5:
        return True, (
            f"{cohort_count} workers registered within 24h of this worker "
            f"(registered at {worker.created_at.strftime('%Y-%m-%d %H:%M')}) -- "
            "bulk registration pattern detected"
        )
    return False, ""


# -- Main evaluate function ---------------------------------------------------

def evaluate(
    worker: Worker,
    disruption: Disruption,
    policy: Policy,
    db: Session,
) -> FraudResult:
    """
    Run BAS scoring + 4 syndicate signal checks.
    Returns a FraudResult with bas_score, fraud_score, ring_signals, and fraud_flags.
    """
    telemetry = _mock_telemetry(simulate_fraud=settings.simulate_fraud)
    bas_score = _compute_bas(telemetry)

    # -- Syndicate signals --
    ring_signals = []
    fraud_flags = []

    checks = [
        ("temporal_clustering",
         _signal_temporal_clustering(worker, disruption, db)),
        ("platform_order_inversion",
         _signal_platform_order_inversion(worker, disruption)),
        ("velocity_anomaly",
         _signal_velocity_anomaly(worker, policy, db)),
        ("cohort_registration_burst",
         _signal_cohort_registration_burst(worker, db)),
    ]

    for signal_name, (triggered, detail) in checks:
        if triggered:
            ring_signals.append(signal_name)
            fraud_flags.append(detail)

    # Add a telemetry-derived flag when simulate_fraud is on (for UI clarity)
    if settings.simulate_fraud:
        flag_detail = (
            f"GPS signal quality {telemetry['gps_quality']*100:.0f}% -- "
            f"inconsistent with {disruption.severity} {disruption.type} conditions. "
            f"Network switched 0 times in 4 hours -- suggests indoor WiFi connection."
        )
        fraud_flags.append(flag_detail)

    # -- Composite fraud score --
    from ml.fraud_detector import score_features

    # Zone claim rate (last 1 hour)
    recent_zone_claims = (
        db.query(Claim)
        .join(Worker, Worker.id == Claim.worker_id)
        .filter(
            Worker.city == disruption.city,
            Claim.created_at >= datetime.utcnow() - timedelta(hours=1),
        )
        .count()
    )
    total_zone_workers = max(
        1, db.query(Worker).filter(Worker.city == disruption.city).count()
    )
    zone_claim_rate = min(1.0, recent_zone_claims / total_zone_workers)

    # Claim velocity fraction (claims this week / max allowed)
    recent_7d = (
        db.query(Claim)
        .filter(
            Claim.worker_id == worker.id,
            Claim.created_at >= datetime.utcnow() - timedelta(days=7),
            Claim.status != "rejected",
        )
        .count()
    )
    max_days = int(policy.max_days_per_week) if policy.max_days_per_week else 1
    velocity_fraction = min(1.0, recent_7d / max_days)

    platform_normal = 1.0 if _signal_platform_order_inversion(worker, disruption)[0] else 0.0

    feature_vec = [
        telemetry["gps_quality"],
        telemetry["network_stability"],
        telemetry["motion_score"],
        telemetry["battery_state"],
        float(telemetry["app_interactions"]),
        velocity_fraction,
        zone_claim_rate,
        platform_normal,
    ]

    model_score = score_features(feature_vec)
    # 8 pts per ring signal keeps normal mass-disruption claims below auto-approve threshold
    signal_boost = len(ring_signals) * 8.0
    # simulate_fraud adds a large boost so fraud claims reliably land in the queue
    if settings.simulate_fraud:
        signal_boost += 35.0
    fraud_score = round(min(100.0, model_score + signal_boost), 2)

    recommendation = (
        "approve" if fraud_score < 35
        else "manual_review" if fraud_score < 70
        else "reject"
    )

    return FraudResult(
        bas_score=bas_score,
        fraud_score=fraud_score,
        ring_signals=ring_signals,
        fraud_flags=fraud_flags,
        recommendation=recommendation,
    )
