import json
import os

_DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "ndma_alerts.json")

CITY_TO_DISTRICT = {
    "Bengaluru": "Bengaluru Urban",
    "Mumbai": "Mumbai",
    "Delhi": "New Delhi",
    "Chennai": "Chennai",
    "Pune": "Pune",
    "Hyderabad": "Hyderabad",
}

SEVERITY_MAP = {"red": "extreme", "orange": "severe", "yellow": "moderate"}


def get_flood_alerts(city: str) -> list:
    """Returns active NDMA flood alerts matching the given city."""
    try:
        with open(_DATA_FILE, "r") as f:
            alerts = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []
    district = CITY_TO_DISTRICT.get(city, city)
    return [a for a in alerts if a.get("district") == district and a.get("active", False)]
