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
