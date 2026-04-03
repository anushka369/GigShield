from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class DisruptionOut(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    type: str
    city: str
    zone: Optional[str] = None
    severity: str
    trigger_value: float
    threshold_value: float
    api_source: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    workers_affected: int = 0   # computed, not on ORM model


class SimulateDisruptionRequest(BaseModel):
    type: str       # rainfall | aqi | flood | bandh | outage
    city: str       # one of ACTIVE_CITIES
    zone: Optional[str] = None
    severity: str   # moderate | severe | extreme


class SimulateDisruptionResponse(BaseModel):
    disruption: DisruptionOut
    claims_created: int
