from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import NaturalGasPrice
from ..schemas import LatestPriceResponse, PricesResponse

router = APIRouter(prefix="/api/prices", tags=["prices"])


@router.get("", response_model=PricesResponse)
def get_prices(
    series_id: str = Query("RNGWHHD"),
    limit: int = Query(60, ge=1, le=500),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(NaturalGasPrice)
        .filter(NaturalGasPrice.series_id == series_id)
        .order_by(desc(NaturalGasPrice.period))
        .limit(limit)
        .all()
    )
    rows.reverse()  # oldest first

    return PricesResponse(
        series_id=series_id,
        units=rows[0].units if rows else "$/MMBtu",
        count=len(rows),
        data=[
            {"date": row.period.strftime("%Y-%m"), "price": float(row.price)}
            for row in rows
        ],
    )


@router.get("/latest", response_model=LatestPriceResponse)
def get_latest_price(
    series_id: str = Query("RNGWHHD"),
    db: Session = Depends(get_db),
):
    row = (
        db.query(NaturalGasPrice)
        .filter(NaturalGasPrice.series_id == series_id)
        .order_by(desc(NaturalGasPrice.period))
        .first()
    )
    if row is None:
        return LatestPriceResponse(date="", price=0)

    return LatestPriceResponse(
        date=row.period.strftime("%Y-%m"),
        price=float(row.price),
    )
