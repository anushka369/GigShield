from datetime import datetime
from sqlalchemy.orm import Session

from database import SessionLocal
from models.disruption import Disruption

ACTIVE_CITIES = ["Bengaluru", "Mumbai", "Delhi", "Chennai", "Pune", "Hyderabad"]

RAINFALL_THRESHOLDS = {"moderate": 15.0, "severe": 35.0, "extreme": 60.0}
AQI_THRESHOLDS = {"severe": 150.0, "extreme": 250.0}


def _already_active(db: Session, city: str, dtype: str) -> bool:
    return (
        db.query(Disruption)
        .filter(
            Disruption.city == city,
            Disruption.type == dtype,
            Disruption.is_active == True,
        )
        .first()
    ) is not None


def _create_disruption(
    db: Session,
    dtype: str,
    city: str,
    zone: str | None,
    severity: str,
    trigger_value: float,
    threshold_value: float,
    api_source: str,
    evidence_json: dict | None,
) -> Disruption:
    d = Disruption(
        type=dtype,
        city=city,
        zone=zone,
        severity=severity,
        trigger_value=trigger_value,
        threshold_value=threshold_value,
        api_source=api_source,
        started_at=datetime.utcnow(),
        is_active=True,
        evidence_json=evidence_json,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    print(f"[TRIGGER] {dtype}/{severity} in {city} ({zone or 'city-wide'}) -- value={trigger_value}")

    # Auto-create claims for all affected workers
    try:
        from services.claim_processor import auto_create_claims_for_disruption
        auto_create_claims_for_disruption(d, db)
    except Exception as e:
        print(f"[WARN] claim_processor dispatch failed for disruption {d.id}: {e}")

    return d


def check_rainfall(db: Session, city: str):
    from integrations.weather import get_rainfall
    data = get_rainfall(city)
    rain_mm = data["rain_mm"]
    for severity in ("extreme", "severe", "moderate"):
        if rain_mm >= RAINFALL_THRESHOLDS[severity]:
            if not _already_active(db, city, "rainfall"):
                _create_disruption(
                    db, "rainfall", city, None, severity,
                    rain_mm, RAINFALL_THRESHOLDS[severity],
                    "openweathermap", data.get("raw"),
                )
            break


def check_aqi(db: Session, city: str):
    from integrations.aqi import get_pm25
    data = get_pm25(city)
    pm25 = data["pm25"]
    for severity in ("extreme", "severe"):
        if pm25 >= AQI_THRESHOLDS[severity]:
            if not _already_active(db, city, "aqi"):
                _create_disruption(
                    db, "aqi", city, None, severity,
                    pm25, AQI_THRESHOLDS[severity],
                    "openaq", data.get("raw"),
                )
            break


def check_platform_outage(db: Session, city: str):
    from integrations.platform_mock import get_platform_status
    status = get_platform_status(city)
    if status.get("status") == "degraded" and status.get("duration_minutes", 0) >= 120:
        if not _already_active(db, city, "outage"):
            _create_disruption(
                db, "outage", city, None, "severe",
                float(status["duration_minutes"]), 120.0,
                "platform_api", status,
            )


def check_flood(db: Session, city: str):
    from integrations.ndma_mock import get_flood_alerts, SEVERITY_MAP
    for alert in get_flood_alerts(city):
        severity = SEVERITY_MAP.get(alert.get("severity", "yellow"), "moderate")
        if not _already_active(db, city, "flood"):
            _create_disruption(
                db, "flood", city, None, severity,
                1.0, 1.0, "ndma_api", alert,
            )
        break  # one flood disruption per city per run


def check_bandh(db: Session, city: str):
    from integrations.social_nlp import analyze_social_signals
    result = analyze_social_signals(city)
    if result.get("confidence", 0) > 0.80:
        if not _already_active(db, city, "bandh"):
            zones = result.get("affected_zones", [])
            _create_disruption(
                db, "bandh", city, zones[0] if zones else None,
                "severe", float(result["confidence"]), 0.80,
                "social_nlp", result,
            )


def run_all_triggers(db: Session | None = None):
    """Runs all 5 checks for every active city. Called by scheduler or directly."""
    should_close = db is None
    if should_close:
        db = SessionLocal()
    try:
        for city in ACTIVE_CITIES:
            for fn in (
                check_rainfall,
                check_aqi,
                check_platform_outage,
                check_flood,
                check_bandh,
            ):
                try:
                    fn(db, city)
                except Exception as e:
                    print(f"[WARN] {fn.__name__}/{city}: {e}")
    finally:
        if should_close:
            db.close()
