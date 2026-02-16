import { SERIES_CONFIG } from "../types";
import "./Controls.css";

interface ControlsProps {
  frequency: string;
  onFrequencyChange: (freq: string) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  selectedSeries: string[];
  onSeriesToggle: (seriesId: string) => void;
}

const DATE_RANGES = [
  { label: "1Y", value: "1Y" },
  { label: "5Y", value: "5Y" },
  { label: "10Y", value: "10Y" },
  { label: "All", value: "All" },
];

export default function Controls({
  frequency,
  onFrequencyChange,
  dateRange,
  onDateRangeChange,
  selectedSeries,
  onSeriesToggle,
}: ControlsProps) {
  return (
    <div className="controls">
      <div className="controls-group">
        <span className="controls-label">Frequency</span>
        <div className="toggle-group">
          <button
            className={frequency === "daily" ? "active" : ""}
            onClick={() => onFrequencyChange("daily")}
          >
            Daily
          </button>
          <button
            className={frequency === "monthly" ? "active" : ""}
            onClick={() => onFrequencyChange("monthly")}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="controls-group">
        <span className="controls-label">Range</span>
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
        >
          {DATE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="controls-group">
        <span className="controls-label">Series</span>
        <div className="series-checkboxes">
          {SERIES_CONFIG.map((s) => (
            <label key={s.id} className="series-checkbox">
              <input
                type="checkbox"
                checked={selectedSeries.includes(s.id)}
                onChange={() => onSeriesToggle(s.id)}
              />
              <span
                className="color-dot"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
