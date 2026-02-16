"""
Sync script — pulls natural gas prices from EIA and upserts into PostgreSQL.

Supports all 5 series, daily frequency, pagination, and incremental updates.

Usage:
    python -m backend.scripts.sync_prices --full          # first time: pull all ~37K records
    python -m backend.scripts.sync_prices                 # incremental: only new records
    python -m backend.scripts.sync_prices --series RNGWHHD,RNGC1 --frequency monthly
    python -m backend.scripts.sync_prices --start 2020-01-01 --end 2025-12-31
"""

import argparse
import os
import sys
import time
from datetime import UTC, date, datetime

import httpx
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert

# Load .env from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Add project root to path so imports work when run as script
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.database import SessionLocal, engine
from backend.models import Base, NaturalGasPrice

EIA_BASE_URL = "https://api.eia.gov/v2/natural-gas/pri/fut/data/"

ALL_SERIES = ["RNGWHHD", "RNGC1", "RNGC2", "RNGC3", "RNGC4"]

PAGE_SIZE = 5000
BATCH_SIZE = 1000
RATE_LIMIT_SLEEP = 0.5


def migrate_schema():
    """Add new columns and update constraints if not already migrated."""
    with engine.begin() as conn:
        # Check if frequency column exists
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'natural_gas_prices' AND column_name = 'frequency'
        """))
        if result.fetchone():
            print("Schema already migrated, skipping.")
            return

        print("Migrating schema...")

        # Add new columns
        conn.execute(text("""
            ALTER TABLE natural_gas_prices
            ADD COLUMN frequency VARCHAR(10) NOT NULL DEFAULT 'monthly',
            ADD COLUMN series_description VARCHAR(200),
            ADD COLUMN duoarea VARCHAR(10),
            ADD COLUMN area_name VARCHAR(100),
            ADD COLUMN product VARCHAR(10),
            ADD COLUMN product_name VARCHAR(100),
            ADD COLUMN process VARCHAR(10),
            ADD COLUMN process_name VARCHAR(100)
        """))

        # Make price nullable
        conn.execute(text("""
            ALTER TABLE natural_gas_prices ALTER COLUMN price DROP NOT NULL
        """))

        # Drop old constraint, create new one
        conn.execute(text("""
            ALTER TABLE natural_gas_prices DROP CONSTRAINT IF EXISTS uq_series_period
        """))
        conn.execute(text("""
            ALTER TABLE natural_gas_prices
            ADD CONSTRAINT uq_series_period_freq UNIQUE (series_id, period, frequency)
        """))

        print("Schema migration complete.")


def get_last_sync_date(db, series_list: list[str], frequency: str) -> str | None:
    """Get the most recent period in the DB for the given series and frequency."""
    row = (
        db.query(NaturalGasPrice.period)
        .filter(
            NaturalGasPrice.series_id.in_(series_list),
            NaturalGasPrice.frequency == frequency,
        )
        .order_by(NaturalGasPrice.period.desc())
        .first()
    )
    if row:
        return row[0].isoformat()
    return None


def fetch_all_pages(
    api_key: str,
    series_list: list[str],
    frequency: str,
    start: str | None = None,
    end: str | None = None,
) -> list[dict]:
    """Fetch all records from EIA API with pagination."""
    all_data = []
    offset = 0

    while True:
        # Build params as list of tuples to support repeated facets[series][]
        params = [
            ("api_key", api_key),
            ("frequency", frequency),
            ("data[0]", "value"),
            ("sort[0][column]", "period"),
            ("sort[0][direction]", "asc"),
            ("offset", str(offset)),
            ("length", str(PAGE_SIZE)),
        ]

        for s in series_list:
            params.append(("facets[series][]", s))

        if start:
            params.append(("start", start))
        if end:
            params.append(("end", end))

        print(f"  Fetching offset={offset} ...")
        resp = httpx.get(EIA_BASE_URL, params=params, timeout=30)
        resp.raise_for_status()

        body = resp.json()["response"]
        data = body.get("data", [])
        total = int(body.get("total", 0))

        all_data.extend(data)
        print(f"  Got {len(data)} records (total available: {total})")

        offset += PAGE_SIZE
        if offset >= total or len(data) == 0:
            break

        time.sleep(RATE_LIMIT_SLEEP)

    return all_data


def parse_period(period_str: str, frequency: str) -> date:
    """Parse period string based on frequency."""
    if frequency == "daily":
        return date.fromisoformat(period_str)
    else:
        # Monthly: "YYYY-MM" -> first of month
        return date.fromisoformat(period_str + "-01")


def build_rows(raw: list[dict], frequency: str) -> list[dict]:
    """Map API records to DB rows."""
    now = datetime.now(UTC)
    rows = []

    for item in raw:
        price = item.get("value")
        if price is not None:
            price = float(price)

        rows.append({
            "series_id": item["series"],
            "period": parse_period(item["period"], frequency),
            "price": price,
            "units": item.get("units", "$/MMBtu"),
            "source": "EIA",
            "fetched_at": now,
            "frequency": frequency,
            "series_description": item.get("series-description"),
            "duoarea": item.get("duoarea"),
            "area_name": item.get("area-name"),
            "product": item.get("product"),
            "product_name": item.get("product-name"),
            "process": item.get("process"),
            "process_name": item.get("process-name"),
        })

    return rows


def upsert_batch(db, rows: list[dict]):
    """Insert rows in batches with upsert on conflict."""
    total_upserted = 0

    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        stmt = insert(NaturalGasPrice).values(batch)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_series_period_freq",
            set_={
                "price": stmt.excluded.price,
                "units": stmt.excluded.units,
                "fetched_at": stmt.excluded.fetched_at,
                "series_description": stmt.excluded.series_description,
                "duoarea": stmt.excluded.duoarea,
                "area_name": stmt.excluded.area_name,
                "product": stmt.excluded.product,
                "product_name": stmt.excluded.product_name,
                "process": stmt.excluded.process,
                "process_name": stmt.excluded.process_name,
            },
        )
        db.execute(stmt)
        total_upserted += len(batch)
        print(f"  Upserted batch: {total_upserted}/{len(rows)}")

    db.commit()
    return total_upserted


def sync_prices(
    series_list: list[str],
    frequency: str = "daily",
    start: str | None = None,
    end: str | None = None,
    full: bool = False,
):
    api_key = os.environ.get("EIA_API_KEY")
    if not api_key:
        print("ERROR: EIA_API_KEY not set in environment or backend/.env")
        sys.exit(1)

    # Ensure table exists
    Base.metadata.create_all(bind=engine)

    # Run migration for existing tables
    migrate_schema()

    # Determine start date for incremental sync
    if not full and start is None:
        db = SessionLocal()
        try:
            last_date = get_last_sync_date(db, series_list, frequency)
            if last_date:
                start = last_date
                print(f"Incremental sync: fetching records from {start} onward")
            else:
                print("No existing data found, doing full fetch")
        finally:
            db.close()

    series_str = ", ".join(series_list)
    print(f"Syncing series=[{series_str}] frequency={frequency}")

    raw = fetch_all_pages(api_key, series_list, frequency, start, end)
    print(f"Total records fetched: {len(raw)}")

    if not raw:
        print("No records to insert.")
        return

    rows = build_rows(raw, frequency)
    print(f"Built {len(rows)} rows for upsert")

    db = SessionLocal()
    try:
        count = upsert_batch(db, rows)
        print(f"Done! Upserted {count} rows into natural_gas_prices")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Sync EIA natural gas prices to DB")
    parser.add_argument(
        "--series",
        default="all",
        help="Comma-separated series IDs, or 'all' for all 5 series (default: all)",
    )
    parser.add_argument(
        "--frequency",
        default="daily",
        help="Frequency: 'daily' or 'monthly' (default: daily)",
    )
    parser.add_argument("--start", default=None, help="Start date (YYYY-MM-DD or YYYY-MM)")
    parser.add_argument("--end", default=None, help="End date (YYYY-MM-DD or YYYY-MM)")
    parser.add_argument(
        "--full",
        action="store_true",
        help="Force full re-fetch (ignore last sync date)",
    )
    args = parser.parse_args()

    if args.series == "all":
        series_list = ALL_SERIES
    else:
        series_list = [s.strip() for s in args.series.split(",")]

    sync_prices(
        series_list=series_list,
        frequency=args.frequency,
        start=args.start,
        end=args.end,
        full=args.full,
    )


if __name__ == "__main__":
    main()
