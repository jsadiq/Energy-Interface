import { useEffect, useState } from "react";
import { fetchNaturalGasPrices } from "./api/eia";
import PriceChart from "./components/PriceChart";
import type { PriceDataPoint } from "./types";
import "./App.css";

function App() {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNaturalGasPrices()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app">
      <h1>Energy Interface</h1>
      <p className="subtitle">Henry Hub Natural Gas Spot Price</p>

      {loading && <p className="status">Loading data...</p>}
      {error && <p className="status error">Error: {error}</p>}
      {!loading && !error && <PriceChart data={data} />}
    </div>
  );
}

export default App;
