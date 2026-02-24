from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import NaturalGasProduction
from ..schemas import (
    LatestProductionResponse,
    ProductionPoint,
    ProductionResponse,
    StateInfo,
    StatesListResponse,
)

router = APIRouter(prefix="/api/production", tags=["production"])


@router.get("/states", response_model=StatesListResponse)
def list_states(db: Session = Depends(get_db)):
    rows = (
        db.query(
            NaturalGasProduction.series_id,
            NaturalGasProduction.duoarea,
            NaturalGasProduction.area_name,
        )
        .distinct()
        .order_by(NaturalGasProduction.area_name)
        .all()
    )
    return StatesListResponse(
        states=[
            StateInfo(series_id=r[0], duoarea=r[1], area_name=r[2])
            for r in rows
        ]
    )


@router.get("", response_model=ProductionResponse)
def get_production(
    series_id: str = Query("N9050US2"),
    limit: int = Query(120, ge=1, le=10000),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(NaturalGasProduction)
        .filter(NaturalGasProduction.series_id == series_id)
        .order_by(desc(NaturalGasProduction.period))
        .limit(limit)
        .all()
    )
    rows.reverse()

    return ProductionResponse(
        series_id=series_id,
        area_name=rows[0].area_name if rows else "",
        units=rows[0].units if rows else "MMCF",
        count=len(rows),
        data=[
            ProductionPoint(
                date=row.period.strftime("%Y-%m"),
                value=float(row.value) if row.value is not None else 0,
            )
            for row in rows
        ],
    )


@router.get("/latest", response_model=LatestProductionResponse)
def get_latest_production(
    series_id: str = Query("N9050US2"),
    db: Session = Depends(get_db),
):
    row = (
        db.query(NaturalGasProduction)
        .filter(NaturalGasProduction.series_id == series_id)
        .order_by(desc(NaturalGasProduction.period))
        .first()
    )
    if row is None:
        return LatestProductionResponse(date="", value=0)

    return LatestProductionResponse(
        date=row.period.strftime("%Y-%m"),
        value=float(row.value) if row.value is not None else 0,
    )
