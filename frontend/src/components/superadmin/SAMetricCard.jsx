import './superadmin.css';

/**
 * SuperAdmin Configurable Metric Card.
 * 
 * @param {Object} props
 * @param {string} props.title - Metric title (e.g. "Total Users", "Gross Revenue")
 * @param {string|number} props.value - Metric value (e.g. 1428, "₹34.5L")
 * @param {string} [props.subtitle] - Context label (e.g. "Platform-wide registered")
 * @param {Object} [props.trend] - Optional change indicator { value, direction: 'up'|'down'|'neutral', label }
 * @param {React.ReactNode} [props.icon] - Optional SVG icon
 * @param {'primary'|'success'|'warning'|'purple'|'default'} [props.variant='default'] - Card accent variant
 * @param {string} [props.className] - Additional classes
 */
export default function SAMetricCard({
  title,
  value,
  subtitle,
  trend = null,
  icon = null,
  variant = 'default',
  className = '',
}) {
  return (
    <div className={`sa-metric-card variant-${variant} ${className}`}>
      <div className="sa-metric-card-header">
        <div className="sa-metric-card-title-group">
          <h4 className="sa-metric-card-title">{title}</h4>
          {subtitle && <p className="sa-metric-card-subtitle">{subtitle}</p>}
        </div>

        {icon && <div className="sa-metric-card-icon-wrap">{icon}</div>}
      </div>

      <div className="sa-metric-card-value-wrap">
        <h2 className="sa-metric-card-value">{value}</h2>

        {trend && (
          <div className={`sa-metric-card-trend trend-${trend.direction || 'up'}`}>
            <span>
              {trend.direction === 'up' && '↑'}
              {trend.direction === 'down' && '↓'}
              {trend.direction === 'neutral' && '→'}
            </span>
            <span>
              {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
            </span>
            {trend.label && (
              <span style={{ fontWeight: 400, opacity: 0.85, marginLeft: 2 }}>
                {trend.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
