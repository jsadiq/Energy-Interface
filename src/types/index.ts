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

// --- Production types ---

export interface ProductionDataPoint {
  date: string;
  value: number;
}

export interface ProductionApiResponse {
  series_id: string;
  area_name: string;
  units: string;
  count: number;
  data: ProductionDataPoint[];
}

export interface StateInfo {
  series_id: string;
  duoarea: string;
  area_name: string;
}

export interface MergedProductionPoint {
  date: string;
  [seriesId: string]: number | string;
}

export const DEFAULT_PRODUCTION_SERIES: SeriesInfo[] = [
  { id: "N9050US2", label: "U.S. Total", color: "#2563eb" },
  { id: "N9050TX2", label: "Texas", color: "#f59e0b" },
  { id: "N9050PA2", label: "Pennsylvania", color: "#10b981" },
  { id: "N9050LA2", label: "Louisiana", color: "#ef4444" },
  { id: "N9050OK2", label: "Oklahoma", color: "#8b5cf6" },
  { id: "N9050NM2", label: "New Mexico", color: "#ec4899" },
];
