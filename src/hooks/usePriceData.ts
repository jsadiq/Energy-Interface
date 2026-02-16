import { useEffect, useState } from "react";
import { fetchMultipleSeries, fetchLatestPrice } from "../api/eia";
import type { LatestPrice, MergedDataPoint } from "../types";
import { SERIES_CONFIG } from "../types";

const FUTURES_IDS = ["RNGC1", "RNGC2", "RNGC3", "RNGC4"];

export function usePriceData(
  selectedSeries: string[],
  frequency: string,
  limit: number
) {
  const [mergedData, setMergedData] = useState<MergedDataPoint[]>([]);
  const [latestPrices, setLatestPrices] = useState<LatestPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Fetch time-series for selected series + latest prices for all series + futures
        const [seriesMap, ...latestResults] = await Promise.all([
          fetchMultipleSeries(selectedSeries, frequency, limit),
          ...SERIES_CONFIG.map((s) => fetchLatestPrice(s.id, "daily")),
        ]);

        if (cancelled) return;

        // Merge time-series data into unified rows keyed by date
        const dateMap = new Map<string, MergedDataPoint>();
        for (const [seriesId, points] of seriesMap) {
          for (const point of points) {
            if (!dateMap.has(point.date)) {
              dateMap.set(point.date, { date: point.date });
            }
            dateMap.get(point.date)![seriesId] = point.price;
          }
        }

        const merged = Array.from(dateMap.values()).sort(
          (a, b) => a.date.localeCompare(b.date)
        );

        setMergedData(merged);
        setLatestPrices(latestResults as LatestPrice[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedSeries.join(","), frequency, limit]);

  return { mergedData, latestPrices, loading, error };
}
