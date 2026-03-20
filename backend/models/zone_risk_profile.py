from sqlalchemy import String, Integer, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DECIMAL
from sqlalchemy.sql import func

from database import Base


class ZoneRiskProfile(Base):
    __tablename__ = "zone_risk_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    city: Mapped[str] = mapped_column(String(50), nullable=False)
    zone: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    flood_risk: Mapped[float | None] = mapped_column(DECIMAL(3, 2), nullable=True)
    aqi_risk: Mapped[float | None] = mapped_column(DECIMAL(3, 2), nullable=True)
    rainfall_risk: Mapped[float | None] = mapped_column(DECIMAL(3, 2), nullable=True)
    strike_risk: Mapped[float | None] = mapped_column(DECIMAL(3, 2), nullable=True)
    overall_risk: Mapped[float | None] = mapped_column(DECIMAL(4, 3), nullable=True)
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("city", "zone", name="uq_city_zone"),)
