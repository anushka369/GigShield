import json
import os
import re

from config import settings

_DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "social_signals.json")
_BANDH_KEYWORDS = [
    "bandh", "curfew", "road block", "road closure",
    "protest", "shutdown", "strike", "blockade",
]


def analyze_social_signals(city: str) -> dict:
    """
    Reads mock social posts for city. Uses Claude API if key is set,
    falls back to keyword detection otherwise.
    Returns {"confidence": 0-1, "event_type": str, "affected_zones": [str]}
    """
    try:
        with open(_DATA_FILE, "r") as f:
            signals = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"confidence": 0.0, "event_type": "none", "affected_zones": []}

    city_posts = [s["text"] for s in signals if s.get("city") == city]
    if not city_posts:
        return {"confidence": 0.0, "event_type": "none", "affected_zones": []}

    if settings.anthropic_api_key:
        return _claude_analyze(city, city_posts)
    return _keyword_analyze(city, city_posts)


def _keyword_analyze(city: str, posts: list) -> dict:
    combined = " ".join(posts).lower()
    hits = [kw for kw in _BANDH_KEYWORDS if kw in combined]
    if len(hits) >= 2:
        event = "curfew" if "curfew" in combined else "bandh"
        return {"confidence": 0.88, "event_type": event, "affected_zones": [city]}
    if len(hits) == 1:
        return {"confidence": 0.55, "event_type": hits[0], "affected_zones": [city]}
    return {"confidence": 0.0, "event_type": "none", "affected_zones": []}


def _claude_analyze(city: str, posts: list) -> dict:
    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=settings.anthropic_api_key)
        prompt = (
            f"Given these simulated social media posts about {city}:\n"
            + "\n".join(posts)
            + "\n\nIs there evidence of a bandh, curfew, or road closure event? "
            'Respond with JSON only: {"confidence": 0-1, "event_type": "bandh|curfew|road_closure|none", "affected_zones": ["zone"]}'
        )
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.content[0].text
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return _keyword_analyze(city, posts)
