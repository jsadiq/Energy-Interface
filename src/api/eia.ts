import type { PriceDataPoint, PricesApiResponse } from "../types";

export async function fetchNaturalGasPrices(): Promise<PriceDataPoint[]> {
  const response = await fetch("/api/prices?series_id=RNGWHHD&limit=60");

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const json: PricesApiResponse = await response.json();
  return json.data;
}
