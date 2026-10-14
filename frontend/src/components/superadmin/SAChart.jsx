import { useState } from 'react';
import './superadmin.css';

/**
 * SuperAdmin Dependency-Free SVG Chart.
 * Supports:
 * - 'area': Smooth area + line chart for continuous metrics (bookings / velocity)
 * - 'bar': Grouped / stacked bar chart for comparative periods (earnings / payouts)
 * 
 * @param {Object} props
 * @param {'area'|'bar'} [props.type='area']
 * @param {Array<Object>} props.data - Series items [{ label|period, [key]: number }]
 * @param {Array<{ key: string, label: string, color: string }>} props.dataKeys - Metric keys to plot
 * @param {string} [props.timeframe] - Active timeframe
 * @param {(timeframe: string) => void} [props.onTimeframeChange] - Timeframe switcher callback
 * @param {Array<{ value: string, label: string }>} [props.timeframeOptions] - Timeframe tab options
 * @param {string} [props.title] - Chart header title
 * @param {string} [props.subtitle] - Chart header subtitle
 * @param {number} [props.height=260] - SVG viewBox height
 * @param {(val: number) => string} [props.valueFormatter] - Formatter for values/tooltips
 * @param {string} [props.className] - Additional classes
 */
export default function SAChart({
  type = 'area',
  data = [],
  dataKeys = [{ key: 'value', label: 'Value', color: '#2563eb' }],
  timeframe = 'weekly',
  onTimeframeChange = null,
  timeframeOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
  ],
  title = '',
  subtitle = '',
  height = 260,
  valueFormatter = (val) => val.toLocaleString(),
  className = '',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const hasData = Array.isArray(data) && data.length > 0;

  // Layout constants for SVG
  const width = 640;
  const padding = { top: 20, right: 24, bottom: 36, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Calculate maximum value across all plotted data keys
  let maxValue = 0;
  if (hasData) {
    data.forEach((item) => {
      dataKeys.forEach((k) => {
        const val = Number(item[k.key]) || 0;
        if (val > maxValue) maxValue = val;
      });
    });
  }

  // Ensure nice scale ceiling
  const yMax = maxValue > 0 ? Math.ceil(maxValue * 1.15) : 100;

  // Grid line counts
  const yTicks = [0, yMax * 0.33, yMax * 0.66, yMax];

  return (
    <div className={`sa-chart-card ${className}`}>
      {(title || onTimeframeChange) && (
        <div className="sa-chart-header">
          <div className="sa-chart-title-group">
            {title && <h3 className="sa-chart-title">{title}</h3>}
            {subtitle && <p className="sa-chart-subtitle">{subtitle}</p>}
          </div>

          {onTimeframeChange && (
            <div className="sa-chart-controls">
              <div className="sa-chart-timeframe-tabs">
                {timeframeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`sa-chart-tab-btn ${timeframe === opt.value ? 'active' : ''}`}
                    onClick={() => onTimeframeChange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!hasData ? (
        <div className="sa-chart-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <p>No chart data available for this timeframe.</p>
        </div>
      ) : (
        <div className="sa-chart-svg-wrap">
          <svg
            className="sa-chart-svg"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              {dataKeys.map((dk) => (
                <linearGradient
                  key={`grad-${dk.key}`}
                  id={`area-grad-${dk.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={dk.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={dk.color} stopOpacity="0.0" />
                </linearGradient>
              ))}
            </defs>

            {/* Horizontal Grid lines */}
            {yTicks.map((tick, i) => {
              const yPos = padding.top + plotHeight - (tick / yMax) * plotHeight;
              return (
                <g key={`ytick-${i}`}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={width - padding.right}
                    y2={yPos}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={padding.left - 8}
                    y={yPos + 4}
                    fontSize="10"
                    fill="#94a3b8"
                    textAnchor="end"
                  >
                    {tick >= 1000 ? `${Math.round(tick / 1000)}k` : Math.round(tick)}
                  </text>
                </g>
              );
            })}

            {/* AREA CHART RENDERING */}
            {type === 'area' && (
              <>
                {dataKeys.map((dk) => {
                  const points = data.map((item, index) => {
                    const x =
                      padding.left +
                      (index / Math.max(data.length - 1, 1)) * plotWidth;
                    const val = Number(item[dk.key]) || 0;
                    const y = padding.top + plotHeight - (val / yMax) * plotHeight;
                    return { x, y, val };
                  });

                  if (points.length === 0) return null;

                  // Build smooth SVG area and stroke path
                  const dLine = points.reduce((acc, p, i) => {
                    return `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                  }, '');

                  const firstP = points[0];
                  const lastP = points[points.length - 1];
                  const baseY = padding.top + plotHeight;
                  const dArea = `${dLine} L ${lastP.x.toFixed(1)},${baseY} L ${firstP.x.toFixed(1)},${baseY} Z`;

                  return (
                    <g key={`area-${dk.key}`}>
                      <path d={dArea} fill={`url(#area-grad-${dk.key})`} />
                      <path
                        d={dLine}
                        fill="none"
                        stroke={dk.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Points */}
                      {points.map((p, idx) => (
                        <circle
                          key={`pt-${idx}`}
                          cx={p.x}
                          cy={p.y}
                          r={hoveredIndex === idx ? 5 : 3}
                          fill="#ffffff"
                          stroke={dk.color}
                          strokeWidth={hoveredIndex === idx ? 2.5 : 1.75}
                        />
                      ))}
                    </g>
                  );
                })}
              </>
            )}

            {/* BAR CHART RENDERING */}
            {type === 'bar' && (
              <>
                {data.map((item, index) => {
                  const slotWidth = plotWidth / data.length;
                  const groupWidth = slotWidth * 0.65;
                  const barWidth = groupWidth / dataKeys.length;
                  const groupX = padding.left + index * slotWidth + (slotWidth - groupWidth) / 2;

                  return (
                    <g key={`bargroup-${index}`}>
                      {dataKeys.map((dk, kIdx) => {
                        const val = Number(item[dk.key]) || 0;
                        const barHeight = (val / yMax) * plotHeight;
                        const x = groupX + kIdx * barWidth;
                        const y = padding.top + plotHeight - barHeight;

                        return (
                          <rect
                            key={`bar-${index}-${dk.key}`}
                            x={x}
                            y={y}
                            width={Math.max(barWidth - 2, 2)}
                            height={Math.max(barHeight, 0)}
                            rx="3"
                            fill={dk.color}
                            opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.6}
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </>
            )}

            {/* X-AXIS LABELS & HOVER HITBOXES */}
            {data.map((item, index) => {
              const xCenter =
                type === 'area'
                  ? padding.left + (index / Math.max(data.length - 1, 1)) * plotWidth
                  : padding.left + (index + 0.5) * (plotWidth / data.length);

              const hitWidth = plotWidth / data.length;
              const hitX = padding.left + index * hitWidth;

              const label = item.label || item.period || `P${index + 1}`;

              return (
                <g key={`xlabel-${index}`}>
                  <text
                    x={xCenter}
                    y={height - 10}
                    fontSize="11"
                    fontWeight={hoveredIndex === index ? '600' : '400'}
                    fill={hoveredIndex === index ? '#0f172a' : '#64748b'}
                    textAnchor="middle"
                  >
                    {label}
                  </text>

                  {/* Interactive invisible hitzone */}
                  <rect
                    x={hitX}
                    y={padding.top}
                    width={hitWidth}
                    height={plotHeight + 20}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredIndex !== null && data[hoveredIndex] && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '6px 10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: 12,
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                {data[hoveredIndex].label || data[hoveredIndex].period}
              </div>
              {dataKeys.map((dk) => (
                <div key={`tip-${dk.key}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: dk.color }} />
                  <span>{dk.label}:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {valueFormatter(Number(data[hoveredIndex][dk.key]) || 0)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {hasData && (
        <div className="sa-chart-legend">
          {dataKeys.map((dk) => (
            <div key={`legend-${dk.key}`} className="sa-chart-legend-item">
              <span className="sa-chart-legend-dot" style={{ background: dk.color }} />
              <span>{dk.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
