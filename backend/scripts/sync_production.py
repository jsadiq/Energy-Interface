"""
Sync script — pulls natural gas production data from EIA and upserts into PostgreSQL.

Fetches marketed production (VGM) for all states from the EIA API.

Usage:
    python -m backend.scripts.sync_production --full          # first time: pull all ~16K records
    python -m backend.scripts.sync_production                 # incremental: only new records
    python -m backend.scripts.sync_production --start 2020-01 --end 2025-12
"""

import argparse
import os
import sys
import time
from datetime import UTC, date, datetime

import httpx
from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert

# Load .env from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Add project root to path so imports work when run as script
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.database import SessionLocal, engine
from backend.models import Base, NaturalGasProduction

EIA_BASE_URL = "https://api.eia.gov/v2/natural-gas/prod/whv/data/"

PAGE_SIZE = 5000
BATCH_SIZE = 1000
RATE_LIMIT_SLEEP = 0.5


def get_last_sync_date(db) -> str | None:
    """Get the most recent period in the DB."""
    row = (
        db.query(NaturalGasProduction.period)
        .order_by(NaturalGasProduction.period.desc())
        .first()
    )
    if row:
        return row[0].strftime("%Y-%m")
    return None


def fetch_all_pages(
    api_key: str,
    start: str | None = None,
    end: str | None = None,
) -> list[dict]:
    """Fetch all records from EIA API with pagination."""
    all_data = []
    offset = 0

    while True:
        params = [
            ("api_key", api_key),
            ("frequency", "monthly"),
            ("data[0]", "value"),
            ("sort[0][column]", "period"),
            ("sort[0][direction]", "asc"),
            ("offset", str(offset)),
            ("length", str(PAGE_SIZE)),
        ]

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


def parse_period(period_str: str) -> date:
    """Parse monthly period string 'YYYY-MM' to first of month."""
    return date.fromisoformat(period_str + "-01")


def build_rows(raw: list[dict]) -> list[dict]:
    """Map API records to DB rows, filtering to VGM (marketed production) only."""
    now = datetime.now(UTC)
    rows = {}

    for item in raw:
        # Skip non-VGM series (e.g. FWA = wellhead prices)
        if item.get("process") != "VGM":
            continue

        val = item.get("value")
        if val is not None:
            val = float(val)

        key = (item["series"], item["period"])
        rows[key] = {
            "series_id": item["series"],
            "period": parse_period(item["period"]),
            "value": val,
            "units": item.get("units", "MMCF"),
            "source": "EIA",
            "fetched_at": now,
            "frequency": "monthly",
            "series_description": item.get("series-description"),
            "duoarea": item.get("duoarea"),
            "area_name": item.get("area-name"),
            "product": item.get("product"),
            "product_name": item.get("product-name"),
            "process": item.get("process"),
            "process_name": item.get("process-name"),
        }

    return list(rows.values())


def upsert_batch(db, rows: list[dict]):
    """Insert rows in batches with upsert on conflict."""
    total_upserted = 0

    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        stmt = insert(NaturalGasProduction).values(batch)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_production_series_period",
            set_={
                "value": stmt.excluded.value,
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


def sync_production(
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

    # Determine start date for incremental sync
    if not full and start is None:
        db = SessionLocal()
        try:
            last_date = get_last_sync_date(db)
            if last_date:
                start = last_date
                print(f"Incremental sync: fetching records from {start} onward")
            else:
                print("No existing data found, doing full fetch")
        finally:
            db.close()

    print("Syncing natural gas production data (all states)")

    raw = fetch_all_pages(api_key, start, end)
    print(f"Total records fetched: {len(raw)}")

    if not raw:
        print("No records to insert.")
        return

    rows = build_rows(raw)
    print(f"Built {len(rows)} rows for upsert")

    db = SessionLocal()
    try:
        count = upsert_batch(db, rows)
        print(f"Done! Upserted {count} rows into natural_gas_production")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Sync EIA natural gas production data to DB")
    parser.add_argument("--start", default=None, help="Start date (YYYY-MM)")
    parser.add_argument("--end", default=None, help="End date (YYYY-MM)")
    parser.add_argument(
        "--full",
        action="store_true",
        help="Force full re-fetch (ignore last sync date)",
    )
    args = parser.parse_args()

    sync_production(
        start=args.start,
        end=args.end,
        full=args.full,
    )


if __name__ == "__main__":
    main()
