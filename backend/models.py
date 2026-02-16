from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Integer, Numeric, String, UniqueConstraint

from .database import Base


class NaturalGasPrice(Base):
    __tablename__ = "natural_gas_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    series_id = Column(String(20), nullable=False)
    period = Column(Date, nullable=False)
    price = Column(Numeric(10, 4), nullable=False)
    units = Column(String(20), default="$/MMBtu")
    source = Column(String(50), default="EIA")
    fetched_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("series_id", "period", name="uq_series_period"),
    )
