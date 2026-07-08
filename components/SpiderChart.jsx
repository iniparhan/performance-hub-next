export default function SpiderChart({ indicators = [] }) {
  const count = Math.max(3, indicators.length || 5);
  const center = 110;
  const radius = 72;

  const points = Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;

    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      angle,
    };
  });

  const polygonPoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const innerPoints = points
    .map((point, index) => {
      const indicator = indicators[index];

      const scoreValue = indicator
        ? Math.min(1, indicator.score / (indicator.maxScore || 5))
        : 0;

      const distance = radius * scoreValue;
      const x = center + Math.cos(point.angle) * distance;
      const y = center + Math.sin(point.angle) * distance;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 220 220"
      className="spider-svg"
      aria-label="Evaluation spider chart"
      role="img"
    >
      <polygon points={polygonPoints} className="spider-grid" />
      <polygon points={innerPoints} className="spider-fill" />

      {points.map((point, index) => (
        <g key={`${point.x}-${point.y}`}>
          <line
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            className="spider-axis"
          />

          <text
            x={point.x}
            y={point.y - 8}
            textAnchor="middle"
            className="spider-label"
          >
            {indicators[index]?.label || `Indicator ${index + 1}`}
          </text>
        </g>
      ))}
    </svg>
  );
}
