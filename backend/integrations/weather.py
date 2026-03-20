import httpx
from config import settings

CITY_TO_OWM = {
    "Bengaluru": "Bengaluru,IN",
    "Mumbai": "Mumbai,IN",
    "Delhi": "Delhi,IN",
    "Chennai": "Chennai,IN",
    "Pune": "Pune,IN",
    "Hyderabad": "Hyderabad,IN",
}


def get_rainfall(city: str) -> dict:
    """Returns {"city", "rain_mm", "raw"}. Falls back to mock if no API key."""
    if not settings.openweathermap_api_key:
        return _mock_rainfall(city)
    try:
        r = httpx.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"q": CITY_TO_OWM.get(city, city), "appid": settings.openweathermap_api_key},
            timeout=10,
        )
        data = r.json()
        rain = data.get("rain", {})
        rain_mm = float(rain.get("1h", rain.get("3h", 0.0)))
        return {"city": city, "rain_mm": rain_mm, "raw": data}
    except Exception:
        return _mock_rainfall(city)


def _mock_rainfall(city: str) -> dict:
    # DEV_TRIGGER_ALL=true returns extreme rainfall to force the trigger
    rain_mm = 72.5 if settings.dev_trigger_all else 0.0
    return {"city": city, "rain_mm": rain_mm, "raw": {"mock": True, "rain_mm": rain_mm}}
