from pydantic import BaseModel, Field
from typing import Optional


class SendOtpRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)


class SendOtpResponse(BaseModel):
    message: str
    dev_otp: Optional[str] = None  # only populated when DEV_MODE=true


class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str = Field(..., min_length=6, max_length=6)


class WorkerOut(BaseModel):
    id: str
    name: str
    phone: str
    city: str
    zone: str
    platform: str
    is_verified: bool


class VerifyOtpResponse(BaseModel):
    new_user: Optional[bool] = None
    phone: Optional[str] = None
    token: Optional[str] = None
    worker: Optional[WorkerOut] = None
