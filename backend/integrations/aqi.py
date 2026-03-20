import httpx
from config import settings


def get_pm25(city: str) -> dict:
    """Returns {"city", "pm25", "raw"}. Falls back to mock if no API key."""
    if not settings.openaq_api_key:
        return _mock_aqi(city)
    try:
        headers = {"X-API-Key": settings.openaq_api_key}
        r = httpx.get(
            "https://api.openaq.org/v2/latest",
            params={"city": city, "parameter": "pm25", "limit": 1},
            headers=headers,
            timeout=10,
        )
        data = r.json()
        pm25 = 0.0
        for result in data.get("results", []):
            for m in result.get("measurements", []):
                if m.get("parameter") == "pm25":
                    pm25 = float(m.get("value", 0))
                    break
        return {"city": city, "pm25": pm25, "raw": data}
    except Exception:
        return _mock_aqi(city)


def _mock_aqi(city: str) -> dict:
    # dev_trigger_all → extreme AQI for all cities
    # Delhi always gets realistic high AQI (165) even in normal mock
    if settings.dev_trigger_all:
        pm25 = 278.0
    elif city == "Delhi":
        pm25 = 165.0   # realistic — triggers "severe" threshold (150)
    else:
        pm25 = 0.0
    return {"city": city, "pm25": pm25, "raw": {"mock": True}}
