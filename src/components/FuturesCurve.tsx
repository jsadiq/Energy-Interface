import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import type { LatestPrice, FuturesCurvePoint } from "../types";
import { SERIES_CONFIG } from "../types";

interface FuturesCurveProps {
  latestPrices: LatestPrice[];
}

const FUTURES_CONFIG = SERIES_CONFIG.filter((s) => s.id.startsWith("RNGC"));

export default function FuturesCurve({ latestPrices }: FuturesCurveProps) {
  const spotPrice = latestPrices.find((lp) => lp.series_id === "RNGWHHD");

  const data: FuturesCurvePoint[] = FUTURES_CONFIG.map((config) => {
    const lp = latestPrices.find((p) => p.series_id === config.id);
    return {
      contract: config.label,
      series_id: config.id,
      price: lp?.price ?? 0,
    };
  });

  return (
    <div className="chart-panel">
      <h2 className="panel-title">Futures Curve</h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="contract"
            tick={{ fontSize: 11, fill: "#999" }}
            stroke="#555"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#999" }}
            stroke="#555"
            label={{
              value: "$/MMBtu",
              angle: -90,
              position: "insideLeft",
              fill: "#999",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e1e1e",
              border: "1px solid #444",
              borderRadius: "6px",
            }}
          />
          {spotPrice && (
            <ReferenceLine
              y={spotPrice.price}
              stroke="#2563eb"
              strokeDasharray="5 5"
              label={{
                value: `Spot $${spotPrice.price.toFixed(2)}`,
                fill: "#2563eb",
                fontSize: 12,
                position: "right",
              }}
            />
          )}
          <Bar dataKey="price" radius={[4, 4, 0, 0]}>
            {data.map((entry) => {
              const config = FUTURES_CONFIG.find(
                (c) => c.id === entry.series_id
              );
              return (
                <Cell
                  key={entry.series_id}
                  fill={config?.color ?? "#888"}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
