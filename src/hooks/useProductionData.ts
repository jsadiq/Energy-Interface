import { useEffect, useState } from "react";
import { fetchMultipleProduction, fetchProductionStates } from "../api/eia";
import type { MergedProductionPoint, StateInfo } from "../types";

export function useProductionData(selectedSeries: string[], limit: number) {
  const [mergedData, setMergedData] = useState<MergedProductionPoint[]>([]);
  const [availableStates, setAvailableStates] = useState<StateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [seriesMap, states] = await Promise.all([
          fetchMultipleProduction(selectedSeries, limit),
          fetchProductionStates(),
        ]);

        if (cancelled) return;

        const dateMap = new Map<string, MergedProductionPoint>();
        for (const [seriesId, points] of seriesMap) {
          for (const point of points) {
            if (!dateMap.has(point.date)) {
              dateMap.set(point.date, { date: point.date });
            }
            dateMap.get(point.date)![seriesId] = point.value;
          }
        }

        const merged = Array.from(dateMap.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        setMergedData(merged);
        setAvailableStates(states);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch data"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedSeries.join(","), limit]);

  return { mergedData, availableStates, loading, error };
}
