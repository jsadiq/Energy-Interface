from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Index, Integer, Numeric, String, UniqueConstraint

from .database import Base


class NaturalGasPrice(Base):
    __tablename__ = "natural_gas_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    series_id = Column(String(20), nullable=False)
    period = Column(Date, nullable=False)
    price = Column(Numeric(10, 4), nullable=True)
    units = Column(String(20), default="$/MMBtu")
    source = Column(String(50), default="EIA")
    fetched_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # New columns
    frequency = Column(String(10), nullable=False, default="daily")
    series_description = Column(String(200))
    duoarea = Column(String(10))
    area_name = Column(String(100))
    product = Column(String(10))
    product_name = Column(String(100))
    process = Column(String(10))
    process_name = Column(String(100))

    __table_args__ = (
        UniqueConstraint("series_id", "period", "frequency", name="uq_series_period_freq"),
    )


class NaturalGasProduction(Base):
    __tablename__ = "natural_gas_production"

    id = Column(Integer, primary_key=True, autoincrement=True)
    series_id = Column(String(30), nullable=False, index=True)
    period = Column(Date, nullable=False)
    value = Column(Numeric(12, 2), nullable=True)
    units = Column(String(20), default="MMCF")
    source = Column(String(50), default="EIA")
    fetched_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    frequency = Column(String(10), nullable=False, default="monthly")
    series_description = Column(String(200))
    duoarea = Column(String(10), index=True)
    area_name = Column(String(100))
    product = Column(String(10))
    product_name = Column(String(100))
    process = Column(String(10))
    process_name = Column(String(100))

    __table_args__ = (
        UniqueConstraint("series_id", "period", name="uq_production_series_period"),
    )
