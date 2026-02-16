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
    frequency: str = Query("monthly"),
    limit: int = Query(60, ge=1, le=10000),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(NaturalGasPrice)
        .filter(
            NaturalGasPrice.series_id == series_id,
            NaturalGasPrice.frequency == frequency,
        )
        .order_by(desc(NaturalGasPrice.period))
        .limit(limit)
        .all()
    )
    rows.reverse()  # oldest first

    date_fmt = "%Y-%m-%d" if frequency == "daily" else "%Y-%m"

    return PricesResponse(
        series_id=series_id,
        units=rows[0].units if rows else "$/MMBtu",
        count=len(rows),
        data=[
            {
                "date": row.period.strftime(date_fmt),
                "price": float(row.price) if row.price is not None else 0,
            }
            for row in rows
        ],
    )


@router.get("/latest", response_model=LatestPriceResponse)
def get_latest_price(
    series_id: str = Query("RNGWHHD"),
    frequency: str = Query("monthly"),
    db: Session = Depends(get_db),
):
    row = (
        db.query(NaturalGasPrice)
        .filter(
            NaturalGasPrice.series_id == series_id,
            NaturalGasPrice.frequency == frequency,
        )
        .order_by(desc(NaturalGasPrice.period))
        .first()
    )
    if row is None:
        return LatestPriceResponse(date="", price=0)

    date_fmt = "%Y-%m-%d" if frequency == "daily" else "%Y-%m"

    return LatestPriceResponse(
        date=row.period.strftime(date_fmt),
        price=float(row.price) if row.price is not None else 0,
    )
