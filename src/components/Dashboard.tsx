import { useState, useCallback } from "react";
import { usePriceData } from "../hooks/usePriceData";
import Controls from "./Controls";
import StatCards from "./StatCards";
import ComparisonChart from "./ComparisonChart";
import FuturesCurve from "./FuturesCurve";
import "./Dashboard.css";

function getLimitForRange(range: string, frequency: string): number {
  const daily = frequency === "daily";
  switch (range) {
    case "1Y":
      return daily ? 365 : 12;
    case "5Y":
      return daily ? 1825 : 60;
    case "10Y":
      return daily ? 3650 : 120;
    case "All":
      return 99999;
    default:
      return daily ? 1825 : 60;
  }
}

export default function Dashboard() {
  const [frequency, setFrequency] = useState("monthly");
  const [dateRange, setDateRange] = useState("5Y");
  const [selectedSeries, setSelectedSeries] = useState([
    "RNGWHHD",
    "RNGC1",
  ]);

  const limit = getLimitForRange(dateRange, frequency);
  const { mergedData, latestPrices, loading, error } = usePriceData(
    selectedSeries,
    frequency,
    limit
  );

  const handleSeriesToggle = useCallback((seriesId: string) => {
    setSelectedSeries((prev) =>
      prev.includes(seriesId)
        ? prev.filter((id) => id !== seriesId)
        : [...prev, seriesId]
    );
  }, []);

  return (
    <div className="dashboard">
      <h1>Energy Interface</h1>
      <p className="dashboard-subtitle">Natural Gas Market Dashboard</p>

      <Controls
        frequency={frequency}
        onFrequencyChange={setFrequency}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedSeries={selectedSeries}
        onSeriesToggle={handleSeriesToggle}
      />

      {loading && <p className="status">Loading data...</p>}
      {error && <p className="status error">Error: {error}</p>}

      {!loading && !error && (
        <>
          <StatCards
            latestPrices={latestPrices}
            selectedSeries={selectedSeries}
          />
          <ComparisonChart
            data={mergedData}
            selectedSeries={selectedSeries}
          />
          <FuturesCurve latestPrices={latestPrices} />
        </>
      )}
    </div>
  );
}
