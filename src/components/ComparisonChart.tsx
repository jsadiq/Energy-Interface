import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MergedDataPoint } from "../types";
import { SERIES_CONFIG } from "../types";

interface ComparisonChartProps {
  data: MergedDataPoint[];
  selectedSeries: string[];
}

export default function ComparisonChart({
  data,
  selectedSeries,
}: ComparisonChartProps) {
  const activeSeries = SERIES_CONFIG.filter((s) =>
    selectedSeries.includes(s.id)
  );

  return (
    <div className="chart-panel">
      <h2 className="panel-title">Price Comparison</h2>
      <ResponsiveContainer width="100%" height={420}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
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
          <Legend />
          {activeSeries.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
