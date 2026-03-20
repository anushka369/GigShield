import random
import redis as redis_lib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt
from datetime import datetime, timedelta, timezone

from config import settings
from database import get_db
from models.worker import Worker
from schemas.auth import (
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    WorkerOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Lazy Redis client — initialised on first request, not at import time
_redis: redis_lib.Redis | None = None


def get_redis() -> redis_lib.Redis:
    global _redis
    if _redis is None:
        _redis = redis_lib.from_url(settings.redis_url, decode_responses=True)
    return _redis


def _make_jwt(worker_id: str, phone: str, role: str = "worker") -> str:
    payload = {
        "worker_id": worker_id,
        "phone": phone,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.jwt_expiry_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


@router.post("/send-otp", response_model=SendOtpResponse)
def send_otp(body: SendOtpRequest):
    otp = str(random.randint(100000, 999999))
    get_redis().setex(f"otp:{body.phone}", 300, otp)  # TTL = 300 s
    resp: dict = {"message": "OTP sent"}
    if settings.dev_mode:
        resp["dev_otp"] = otp
    return resp


@router.post("/verify-otp", response_model=VerifyOtpResponse)
def verify_otp(body: VerifyOtpRequest, db: Session = Depends(get_db)):
    stored = get_redis().get(f"otp:{body.phone}")
    if not stored or stored != body.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    get_redis().delete(f"otp:{body.phone}")  # one-time use

    worker = db.query(Worker).filter(Worker.phone == body.phone).first()
    if not worker:
        return VerifyOtpResponse(new_user=True, phone=body.phone)

    token = _make_jwt(str(worker.id), worker.phone)
    return VerifyOtpResponse(
        token=token,
        worker=WorkerOut(
            id=str(worker.id),
            name=worker.name,
            phone=worker.phone,
            city=worker.city,
            zone=worker.zone,
            platform=worker.platform,
            is_verified=worker.is_verified,
        ),
    )
