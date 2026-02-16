export interface PriceDataPoint {
  date: string;
  price: number;
}

export interface PricesApiResponse {
  series_id: string;
  units: string;
  count: number;
  data: PriceDataPoint[];
}

export interface LatestPrice {
  series_id: string;
  date: string;
  price: number;
}

export interface MergedDataPoint {
  date: string;
  [seriesId: string]: number | string;
}

export interface FuturesCurvePoint {
  contract: string;
  series_id: string;
  price: number;
}

export interface SeriesInfo {
  id: string;
  label: string;
  color: string;
}

export const SERIES_CONFIG: SeriesInfo[] = [
  { id: "RNGWHHD", label: "Spot (Henry Hub)", color: "#2563eb" },
  { id: "RNGC1", label: "Futures Contract 1", color: "#f59e0b" },
  { id: "RNGC2", label: "Futures Contract 2", color: "#10b981" },
  { id: "RNGC3", label: "Futures Contract 3", color: "#ef4444" },
  { id: "RNGC4", label: "Futures Contract 4", color: "#8b5cf6" },
];
