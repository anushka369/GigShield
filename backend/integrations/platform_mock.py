import random
from config import settings


def get_platform_status(city: str) -> dict:
    """
    Returns platform status for a city.
    95% operational, 5% degraded — or always degraded when SIMULATE_OUTAGE=true.
    """
    if settings.simulate_outage:
        return {
            "status": "degraded",
            "order_rate_normal": False,
            "affected_cities": [city],
            "duration_minutes": 180,
            "platform": "zomato",
        }
    if random.random() > 0.05:
        return {"status": "operational", "order_rate_normal": True, "city": city}
    return {
        "status": "degraded",
        "order_rate_normal": False,
        "affected_cities": [city],
        "duration_minutes": random.randint(60, 240),
        "platform": "zomato",
    }


def get_zone_order_rate(city: str) -> dict:
    """Used by fraud engine to check if orders are actually flowing in a zone."""
    return {"order_rate_normal": get_platform_status(city).get("order_rate_normal", True)}
