import uuid
from sqlalchemy import String, Boolean, DateTime, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DECIMAL
from sqlalchemy.sql import func

from database import Base


class Disruption(Base):
    __tablename__ = "disruptions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    city: Mapped[str] = mapped_column(String(50), nullable=False)
    zone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    trigger_value: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    threshold_value: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    api_source: Mapped[str] = mapped_column(String(100), nullable=False)
    started_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    ended_at: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    evidence_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
