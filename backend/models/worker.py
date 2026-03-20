import uuid
from sqlalchemy import String, Boolean, SmallInteger, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DECIMAL
from sqlalchemy.sql import func

from database import Base


class Worker(Base):
    __tablename__ = "workers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(15), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(200), unique=True, nullable=True)
    city: Mapped[str] = mapped_column(String(50), nullable=False)
    zone: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str] = mapped_column(String(10), nullable=False)
    platform: Mapped[str] = mapped_column(String(20), nullable=False)
    platform_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    upi_id: Mapped[str] = mapped_column(String(100), nullable=False)
    avg_daily_earning: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    years_active: Mapped[int] = mapped_column(SmallInteger, default=0, server_default="0")
    risk_score: Mapped[float | None] = mapped_column(DECIMAL(4, 3), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
