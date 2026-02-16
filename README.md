# Energy Interface

A dashboard that visualizes U.S. natural gas prices (Henry Hub spot price) using data from the [EIA API](https://www.eia.gov/opendata/).

A Python + FastAPI backend syncs price data into PostgreSQL and serves it to a React frontend — keeping the API key off the client and enabling fast, cached responses.

## Stack

- **Frontend:** React + TypeScript + Recharts
- **Backend:** Python + FastAPI + SQLAlchemy
- **Database:** PostgreSQL

## Project Structure

```
Energy Interface/
├── src/                        # React frontend
│   ├── api/eia.ts              # Fetches from /api/prices
│   ├── components/PriceChart.tsx
│   └── types/index.ts
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── database.py             # SQLAlchemy engine + session
│   ├── models.py               # NaturalGasPrice ORM model
│   ├── schemas.py              # Pydantic response models
│   ├── routers/prices.py       # GET /api/prices, /api/prices/latest
│   └── scripts/sync_prices.py  # Manual EIA data sync
├── vite.config.ts              # Vite config with /api proxy
└── package.json
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

## Setup

### 1. Clone and install frontend dependencies

```bash
git clone https://github.com/jsadiq/Energy-Interface.git
cd Energy-Interface
npm install
```

### 2. Create the database

```bash
createdb energy_interface
```

### 3. Set up the backend

```bash
python -m venv backend/.venv
source backend/.venv/Scripts/activate   # Windows Git Bash
# source backend/.venv/bin/activate     # macOS/Linux
pip install -r backend/requirements.txt
```

### 4. Configure environment

Copy the template and add your EIA API key:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```
EIA_API_KEY=your_key_here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/energy_interface
```

Get a free API key at [eia.gov/opendata](https://www.eia.gov/opendata/).

### 5. Start the backend

```bash
uvicorn backend.main:app --reload --port 8000
```

### 6. Sync price data

```bash
python -m backend.scripts.sync_prices
```

Options:

```
--length 120          # Number of months (default: 60)
--start 2020-01       # Start period
--end 2024-12         # End period
--series RNGWHHD      # EIA series ID (default: RNGWHHD)
```

### 7. Start the frontend

```bash
npm run dev
```

Open http://localhost:5173 — the chart renders Henry Hub natural gas prices from your local database.

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/prices?series_id=RNGWHHD&limit=60` | Monthly prices, oldest-first |
| `GET /api/prices/latest` | Most recent data point |
| `GET /api/health` | Health check |
