import { useState, useCallback } from "react";
import { usePriceData } from "../hooks/usePriceData";
import { useProductionData } from "../hooks/useProductionData";
import { DEFAULT_PRODUCTION_SERIES } from "../types";
import Controls from "./Controls";
import StatCards from "./StatCards";
import ComparisonChart from "./ComparisonChart";
import FuturesCurve from "./FuturesCurve";
import ProductionControls from "./ProductionControls";
import ProductionChart from "./ProductionChart";
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
      return 10000;
    default:
      return daily ? 1825 : 60;
  }
}

function getMonthlyLimit(range: string): number {
  switch (range) {
    case "1Y":
      return 12;
    case "5Y":
      return 60;
    case "10Y":
      return 120;
    case "All":
      return 10000;
    default:
      return 60;
  }
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"prices" | "production">(
    "prices"
  );

  // Price state
  const [frequency, setFrequency] = useState("monthly");
  const [dateRange, setDateRange] = useState("5Y");
  const [selectedSeries, setSelectedSeries] = useState([
    "RNGWHHD",
    "RNGC1",
  ]);

  // Production state
  const [prodDateRange, setProdDateRange] = useState("5Y");
  const [selectedProdSeries, setSelectedProdSeries] = useState(
    DEFAULT_PRODUCTION_SERIES.slice(0, 3).map((s) => s.id)
  );

  const priceLimit = getLimitForRange(dateRange, frequency);
  const prodLimit = getMonthlyLimit(prodDateRange);

  const { mergedData, latestPrices, loading, error } = usePriceData(
    activeTab === "prices" ? selectedSeries : [],
    frequency,
    priceLimit
  );

  const {
    mergedData: prodData,
    availableStates,
    loading: prodLoading,
    error: prodError,
  } = useProductionData(
    activeTab === "production" ? selectedProdSeries : [],
    prodLimit
  );

  const handleSeriesToggle = useCallback((seriesId: string) => {
    setSelectedSeries((prev) =>
      prev.includes(seriesId)
        ? prev.filter((id) => id !== seriesId)
        : [...prev, seriesId]
    );
  }, []);

  const handleProdSeriesToggle = useCallback((seriesId: string) => {
    setSelectedProdSeries((prev) =>
      prev.includes(seriesId)
        ? prev.filter((id) => id !== seriesId)
        : [...prev, seriesId]
    );
  }, []);

  const handleAddState = useCallback((seriesId: string) => {
    setSelectedProdSeries((prev) =>
      prev.includes(seriesId) ? prev : [...prev, seriesId]
    );
  }, []);

  return (
    <div className="dashboard">
      <h1>Energy Interface</h1>
      <p className="dashboard-subtitle">Natural Gas Market Dashboard</p>

      <div className="tab-bar">
        <button
          className={activeTab === "prices" ? "active" : ""}
          onClick={() => setActiveTab("prices")}
        >
          Prices
        </button>
        <button
          className={activeTab === "production" ? "active" : ""}
          onClick={() => setActiveTab("production")}
        >
          Production
        </button>
      </div>

      {activeTab === "prices" && (
        <>
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
        </>
      )}

      {activeTab === "production" && (
        <>
          <ProductionControls
            dateRange={prodDateRange}
            onDateRangeChange={setProdDateRange}
            selectedSeries={selectedProdSeries}
            onSeriesToggle={handleProdSeriesToggle}
            availableStates={availableStates}
            onAddState={handleAddState}
          />

          {prodLoading && <p className="status">Loading data...</p>}
          {prodError && (
            <p className="status error">Error: {prodError}</p>
          )}

          {!prodLoading && !prodError && (
            <ProductionChart
              data={prodData}
              selectedSeries={selectedProdSeries}
              availableStates={availableStates}
            />
          )}
        </>
      )}
    </div>
  );
}
