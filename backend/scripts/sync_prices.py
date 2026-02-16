"""
Manual sync script — pulls natural gas prices from EIA and upserts into PostgreSQL.

Usage:
    python -m backend.scripts.sync_prices
    python -m backend.scripts.sync_prices --length 120
    python -m backend.scripts.sync_prices --start 2020-01 --end 2024-12
    python -m backend.scripts.sync_prices --series RNGWHHD
"""

import argparse
import os
import sys
from datetime import UTC, date, datetime

import httpx
from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert

# Load .env from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Add project root to path so imports work when run as script
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.database import SessionLocal, engine
from backend.models import Base, NaturalGasPrice

EIA_BASE_URL = "https://api.eia.gov/v2/natural-gas/pri/fut/data/"


def fetch_from_eia(
    api_key: str,
    series: str,
    length: int,
    start: str | None = None,
    end: str | None = None,
) -> list[dict]:
    params = {
        "api_key": api_key,
        "frequency": "monthly",
        "data[0]": "value",
        "facets[series][]": series,
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        "offset": "0",
        "length": str(length),
    }
    if start:
        params["start"] = start
    if end:
        params["end"] = end

    resp = httpx.get(EIA_BASE_URL, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()["response"]["data"]


def sync_prices(
    series: str = "RNGWHHD",
    length: int = 60,
    start: str | None = None,
    end: str | None = None,
):
    api_key = os.environ.get("EIA_API_KEY")
    if not api_key:
        print("ERROR: EIA_API_KEY not set in environment or backend/.env")
        sys.exit(1)

    print(f"Fetching {length} records for series {series} from EIA...")
    raw = fetch_from_eia(api_key, series, length, start, end)
    print(f"Received {len(raw)} records from EIA")

    # Filter nulls and build rows
    rows = []
    for item in raw:
        if item.get("value") is None:
            continue
        rows.append(
            {
                "series_id": series,
                "period": date.fromisoformat(item["period"] + "-01"),
                "price": float(item["value"]),
                "units": "$/MMBtu",
                "source": "EIA",
                "fetched_at": datetime.now(UTC),
            }
        )

    if not rows:
        print("No valid rows to insert.")
        return

    # Ensure table exists
    Base.metadata.create_all(bind=engine)

    # Upsert
    db = SessionLocal()
    try:
        stmt = insert(NaturalGasPrice).values(rows)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_series_period",
            set_={
                "price": stmt.excluded.price,
                "fetched_at": stmt.excluded.fetched_at,
            },
        )
        db.execute(stmt)
        db.commit()
        print(f"Upserted {len(rows)} rows into natural_gas_prices")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Sync EIA natural gas prices to DB")
    parser.add_argument("--series", default="RNGWHHD", help="EIA series ID")
    parser.add_argument("--length", type=int, default=60, help="Number of records")
    parser.add_argument("--start", default=None, help="Start period (YYYY-MM)")
    parser.add_argument("--end", default=None, help="End period (YYYY-MM)")
    args = parser.parse_args()

    sync_prices(
        series=args.series,
        length=args.length,
        start=args.start,
        end=args.end,
    )


if __name__ == "__main__":
    main()
