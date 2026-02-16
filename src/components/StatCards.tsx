import type { LatestPrice } from "../types";
import { SERIES_CONFIG } from "../types";
import StatCard from "./StatCard";

interface StatCardsProps {
  latestPrices: LatestPrice[];
  selectedSeries: string[];
}

export default function StatCards({ latestPrices, selectedSeries }: StatCardsProps) {
  const activePrices = latestPrices.filter((lp) =>
    selectedSeries.includes(lp.series_id)
  );

  return (
    <div className="stat-cards">
      {activePrices.map((lp) => {
        const config = SERIES_CONFIG.find((s) => s.id === lp.series_id);
        if (!config) return null;
        return (
          <StatCard
            key={lp.series_id}
            label={config.label}
            price={lp.price}
            date={lp.date}
            color={config.color}
          />
        );
      })}
    </div>
  );
}
