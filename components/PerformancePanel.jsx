import { useMemo, useState } from "react";
import SpiderChart from "./SpiderChart";

export default function PerformancePanel({
  activeQuartal,
  performanceByQuarter,
  quarterOptions,
}) {
  const sortedOptions = useMemo(
    () => [...(quarterOptions || [])].sort((a, b) => a.quartal - b.quartal),
    [quarterOptions],
  );
  const defaultQuarter = activeQuartal || sortedOptions[0]?.quartal || "";
  const [selectedQuarter, setSelectedQuarter] = useState("");

  const normalizedQuarter = Number(selectedQuarter || defaultQuarter || 0);
  const snapshots = (performanceByQuarter || []).filter(
    (item) => item.quartal === normalizedQuarter,
  );

  return (
    <div className="panel performance-panel">
      <div className="panel-header">
        <h3>Personal Performance Overview</h3>
        <select
          className="quarter-selector"
          value={String(selectedQuarter || defaultQuarter)}
          onChange={(event) => setSelectedQuarter(event.target.value)}
        >
          {!sortedOptions.length ? <option value="">Quarter -</option> : null}
          {sortedOptions.map((item) => (
            <option key={item.quartal} value={item.quartal}>
              Quarter {item.quartal}
              {item.isOpen ? " (Open)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="performance-chart-grid">
        {!snapshots.length ? (
          <div className="notice">
            No submitted performance data is available for this quarter.
          </div>
        ) : (
          snapshots.map((snapshot) => (
            <div className="radar-placeholder" key={snapshot.type}>
              <div className="chart-title">
                {snapshot.type === "UPWARD"
                  ? "Upward Evaluation"
                  : "Downward Evaluation"}
              </div>
              <div className="spider-chart">
                <SpiderChart indicators={snapshot.indicators} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
