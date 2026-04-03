from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_worker
from models.disruption import Disruption
from models.worker import Worker

router = APIRouter(prefix="/disruptions", tags=["disruptions"])


@router.get("/active")
def get_active_disruptions(
    city: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    worker: Worker = Depends(get_current_worker),
    db: Session = Depends(get_db),
):
    """Return active disruptions for a city/zone — used by worker dashboard polling."""
    q = db.query(Disruption).filter(Disruption.is_active == True)  # noqa: E712
    if city:
        q = q.filter(Disruption.city == city)
    if zone:
        # city-wide disruptions (zone=None) affect all zones in that city
        q = q.filter((Disruption.zone == zone) | (Disruption.zone == None))  # noqa: E711
    return q.order_by(Disruption.started_at.desc()).all()
