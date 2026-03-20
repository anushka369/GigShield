import uuid
from sqlalchemy import String, SmallInteger, DateTime, Date, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DECIMAL
from sqlalchemy.sql import func

from database import Base


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workers.id"), nullable=False)
    tier: Mapped[str] = mapped_column(String(20), nullable=False)
    weekly_premium: Mapped[float] = mapped_column(DECIMAL(8, 2), nullable=False)
    base_premium: Mapped[float] = mapped_column(DECIMAL(8, 2), nullable=False)
    coverage_per_day: Mapped[float] = mapped_column(DECIMAL(8, 2), nullable=False)
    max_days_per_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    max_hours_per_day: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", server_default="active")
    start_date: Mapped[Date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    zone_risk_score: Mapped[float | None] = mapped_column(DECIMAL(4, 3), nullable=True)
    seasonal_factor: Mapped[float | None] = mapped_column(DECIMAL(4, 3), nullable=True)
    claim_history_factor: Mapped[float | None] = mapped_column(DECIMAL(4, 3), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
