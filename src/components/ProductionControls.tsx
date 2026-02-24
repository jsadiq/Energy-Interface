import type { StateInfo } from "../types";
import { DEFAULT_PRODUCTION_SERIES } from "../types";
import "./Controls.css";

interface ProductionControlsProps {
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  selectedSeries: string[];
  onSeriesToggle: (seriesId: string) => void;
  availableStates: StateInfo[];
  onAddState: (seriesId: string) => void;
}

const DATE_RANGES = [
  { label: "1Y", value: "1Y" },
  { label: "5Y", value: "5Y" },
  { label: "10Y", value: "10Y" },
  { label: "All", value: "All" },
];

const defaultIds = new Set(DEFAULT_PRODUCTION_SERIES.map((s) => s.id));

export default function ProductionControls({
  dateRange,
  onDateRangeChange,
  selectedSeries,
  onSeriesToggle,
  availableStates,
  onAddState,
}: ProductionControlsProps) {
  const otherStates = availableStates.filter(
    (s) => !defaultIds.has(s.series_id)
  );

  return (
    <div className="controls">
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
        <span className="controls-label">States</span>
        <div className="series-checkboxes">
          {DEFAULT_PRODUCTION_SERIES.map((s) => (
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

      {otherStates.length > 0 && (
        <div className="controls-group">
          <span className="controls-label">Add</span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) onAddState(e.target.value);
            }}
          >
            <option value="">+ Add state...</option>
            {otherStates.map((s) => (
              <option key={s.series_id} value={s.series_id}>
                {s.area_name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
