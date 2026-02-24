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
import type { MergedProductionPoint, StateInfo } from "../types";
import { DEFAULT_PRODUCTION_SERIES } from "../types";

interface ProductionChartProps {
  data: MergedProductionPoint[];
  selectedSeries: string[];
  availableStates: StateInfo[];
}

// Generate a color for states not in the default list
const EXTRA_COLORS = ["#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6"];

export default function ProductionChart({
  data,
  selectedSeries,
  availableStates,
}: ProductionChartProps) {
  const defaultMap = new Map(
    DEFAULT_PRODUCTION_SERIES.map((s) => [s.id, s])
  );

  const lines = selectedSeries.map((id, i) => {
    const defaultInfo = defaultMap.get(id);
    if (defaultInfo) {
      return defaultInfo;
    }
    const state = availableStates.find((s) => s.series_id === id);
    return {
      id,
      label: state?.area_name ?? id,
      color: EXTRA_COLORS[i % EXTRA_COLORS.length],
    };
  });

  return (
    <div className="chart-panel">
      <h2 className="panel-title">Natural Gas Production by State</h2>
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
              value: "MMCF",
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
            formatter={(value: number) => value.toLocaleString()}
          />
          <Legend />
          {lines.map((s) => (
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
