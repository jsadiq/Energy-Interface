from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers.prices import router as prices_router
from .schemas import HealthResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Energy Interface API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prices_router)


@app.get("/api/health", response_model=HealthResponse)
def health():
    return {"status": "ok"}
