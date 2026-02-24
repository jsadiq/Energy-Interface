import type {
  PriceDataPoint,
  PricesApiResponse,
  ProductionApiResponse,
  ProductionDataPoint,
  StateInfo,
} from "../types";

export async function fetchNaturalGasPrices(): Promise<PriceDataPoint[]> {
  const response = await fetch("/api/prices?series_id=RNGWHHD&limit=60");

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const json: PricesApiResponse = await response.json();
  return json.data;
}

export async function fetchPrices(
  seriesId: string,
  frequency: string = "monthly",
  limit: number = 60
): Promise<PricesApiResponse> {
  const response = await fetch(
    `/api/prices?series_id=${seriesId}&frequency=${frequency}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchLatestPrice(
  seriesId: string,
  frequency: string = "daily"
): Promise<{ series_id: string; date: string; price: number }> {
  const response = await fetch(
    `/api/prices?series_id=${seriesId}&frequency=${frequency}&limit=1`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const json: PricesApiResponse = await response.json();
  const point = json.data[0];
  return { series_id: seriesId, date: point.date, price: point.price };
}

export async function fetchMultipleSeries(
  seriesIds: string[],
  frequency: string = "monthly",
  limit: number = 60
): Promise<Map<string, PriceDataPoint[]>> {
  const results = await Promise.all(
    seriesIds.map((id) => fetchPrices(id, frequency, limit))
  );

  const map = new Map<string, PriceDataPoint[]>();
  results.forEach((res) => {
    map.set(res.series_id, res.data);
  });
  return map;
}

// --- Production API ---

export async function fetchProduction(
  seriesId: string,
  limit: number = 120
): Promise<ProductionApiResponse> {
  const response = await fetch(
    `/api/production?series_id=${seriesId}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchProductionStates(): Promise<StateInfo[]> {
  const response = await fetch("/api/production/states");
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  return json.states;
}

export async function fetchMultipleProduction(
  seriesIds: string[],
  limit: number = 120
): Promise<Map<string, ProductionDataPoint[]>> {
  const results = await Promise.all(
    seriesIds.map((id) => fetchProduction(id, limit))
  );
  const map = new Map<string, ProductionDataPoint[]>();
  results.forEach((res) => map.set(res.series_id, res.data));
  return map;
}
