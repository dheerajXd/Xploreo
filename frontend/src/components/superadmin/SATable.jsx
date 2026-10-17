import './superadmin.css';

/**
 * SuperAdmin Reusable Data Table.
 * Configurable, accessible, with loading and empty state support.
 * 
 * @param {Object} props
 * @param {Array<{ key: string, label: string, render?: (val, row, index) => React.ReactNode, align?: 'left'|'center'|'right', width?: string }>} props.columns
 * @param {Array<Object>} props.data - Data rows
 * @param {string} [props.keyField='id'] - Row key field
 * @param {boolean} [props.isLoading=false] - Loading indicator
 * @param {string} [props.emptyTitle='No records found']
 * @param {string} [props.emptyMessage='There are no items matching this filter.']
 * @param {(row: Object) => React.ReactNode} [props.actions] - Optional row actions column
 * @param {string} [props.className] - Additional classes
 */
export default function SATable({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items to display in this view.',
  actions = null,
  className = '',
}) {
  return (
    <div className={`sa-table-container ${className}`}>
      <div className="sa-table-responsive">
        <table className="sa-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.align ? `align-${col.align}` : ''}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
              {actions && <th className="align-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <div className="sa-table-loading">
                    <div className="sa-table-spinner" />
                    <p style={{ margin: '8px 0 0', color: 'var(--sa-text-muted)' }}>
                      Loading data...
                    </p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <div className="sa-table-empty">
                    <div className="sa-table-empty-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h5 className="sa-table-empty-title">{emptyTitle}</h5>
                    <p className="sa-table-empty-message">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => {
                const rowKey = row[keyField] || row.userId || row.transactionId || row.refundId || row.disputeId || row.payoutId || rowIdx;
                return (
                  <tr key={rowKey}>
                    {columns.map((col) => {
                      const val = row[col.key];
                      const rendered = col.render ? col.render(val, row, rowIdx) : val;
                      return (
                        <td key={col.key} className={col.align ? `align-${col.align}` : ''}>
                          {rendered !== undefined && rendered !== null ? rendered : '—'}
                        </td>
                      );
                    })}
                    {actions && (
                      <td className="align-right">
                        {actions(row, rowIdx)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
