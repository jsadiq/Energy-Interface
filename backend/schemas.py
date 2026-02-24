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


class ProductionPoint(BaseModel):
    date: str
    value: float


class ProductionResponse(BaseModel):
    series_id: str
    area_name: str
    units: str
    count: int
    data: list[ProductionPoint]


class StateInfo(BaseModel):
    series_id: str
    duoarea: str
    area_name: str


class StatesListResponse(BaseModel):
    states: list[StateInfo]


class LatestProductionResponse(BaseModel):
    date: str
    value: float
