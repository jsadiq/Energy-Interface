from pydantic import BaseModel


class PricePoint(BaseModel):
    date: str
    price: float


class PricesResponse(BaseModel):
    series_id: str
    units: str
    count: int
    data: list[PricePoint]


class LatestPriceResponse(BaseModel):
    date: str
    price: float


class HealthResponse(BaseModel):
    status: str
