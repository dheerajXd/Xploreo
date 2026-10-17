import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SAMetricCard,
  SATable,
  SABadge,
} from '../../components/superadmin';
import {
  getTechAdminUsers,
  suspendUserAccount,
  reactivateUserAccount,
} from '../../services/techadmin.api.js';
import '../../components/superadmin/superadmin.css';

const ROLE_TABS = [
  { id: 'all', label: 'All Eligible Accounts' },
  { id: 'traveller', label: 'Travelers' },
  { id: 'guide', label: 'Guides' },
  { id: 'hotel', label: 'Hotel Partners' },
  { id: 'experience', label: 'Experience Partners' },
];

/**
 * TechAdmin Users & Partners Console.
 * Allows Tech Admin to view users/partners, view account details,
 * suspend eligible accounts with mandatory reason, and reactivate accounts.
 */
export default function TechAdminUsersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modals state
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [suspendingUser, setSuspendingUser] = useState(null); // User to suspend
  const [suspensionReason, setSuspensionReason] = useState('');
  const [reactivatingUser, setReactivatingUser] = useState(null); // User to reactivate
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Load users
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getTechAdminUsers('all');
      setUsersList(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load users and partners.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { all: 0, traveller: 0, guide: 0, hotel: 0, experience: 0 };
    usersList.forEach((u) => {
      // Respect status filter if applied
      if (statusFilter !== 'all' && u.status !== statusFilter) {
        return;
      }
      counts.all++;
      const r = (u.role || '').toLowerCase();
      if (r === 'traveller' || r === 'traveler') counts.traveller++;
      else if (r === 'guide') counts.guide++;
      else if (r === 'hotel') counts.hotel++;
      else if (r === 'experience') counts.experience++;
    });
    return counts;
  }, [usersList, statusFilter]);

  // Summary Metrics: Total eligible, active accounts, suspended accounts
  const metrics = useMemo(() => {
    const total = usersList.length;
    const active = usersList.filter((u) => u.status === 'active').length;
    const suspended = usersList.filter((u) => u.status === 'inactive').length;
    return { total, active, suspended };
  }, [usersList]);

  // Filtered rows for active tab
  const currentTabUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (activeTab === 'all') return true;
      const r = (u.role || '').toLowerCase();
      if (activeTab === 'traveller') return r === 'traveller' || r === 'traveler';
      return r === activeTab;
    });
  }, [usersList, activeTab]);

  // Filtered rows for active tab + search + status
  const displayedUsers = useMemo(() => {
    return currentTabUsers.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = String(u.name || '').toLowerCase().includes(q);
      const matchEmail = String(u.email || '').toLowerCase().includes(q);
      const matchPhone = String(u.phone || '').toLowerCase().includes(q);
      const matchUsername = String(u.username || u.userId || '').toLowerCase().includes(q);
      const matchLocation = String(u.location || u.region || '').toLowerCase().includes(q);

      return matchName || matchEmail || matchPhone || matchUsername || matchLocation;
    });
  }, [currentTabUsers, statusFilter, searchQuery]);

  // Handlers for Suspend Dialog
  const handleOpenSuspend = (userItem) => {
    setSuspendingUser(userItem);
    setSuspensionReason('');
    setModalError(null);
  };

  const handleConfirmSuspend = async (e) => {
    e.preventDefault();
    if (!suspendingUser) return;
    setModalError(null);

    const trimmedReason = suspensionReason.trim();
    if (!trimmedReason) {
      setModalError('A non-empty suspension reason is required.');
      return;
    }

    setModalSubmitting(true);
    try {
      await suspendUserAccount(
        suspendingUser.userId || suspendingUser.username,
        trimmedReason,
      );
      setSuccessMessage(
        `Account "${suspendingUser.name}" has been suspended. Reason: "${trimmedReason}".`,
      );
      setSuspendingUser(null);
      await loadUsers();
    } catch (err) {
      setModalError(err.message || 'Failed to suspend account.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handlers for Reactivate Dialog
  const handleOpenReactivate = (userItem) => {
    setReactivatingUser(userItem);
    setModalError(null);
  };

  const handleConfirmReactivate = async () => {
    if (!reactivatingUser) return;
    setModalError(null);
    setModalSubmitting(true);

    try {
      await reactivateUserAccount(reactivatingUser.userId || reactivatingUser.username);
      setSuccessMessage(`Account "${reactivatingUser.name}" has been reactivated.`);
      setReactivatingUser(null);
      await loadUsers();
    } catch (err) {
      setModalError(err.message || 'Failed to reactivate account.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Format role label
  const formatRoleLabel = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'traveller' || r === 'traveler') return 'Traveler';
    if (r === 'guide') return 'Guide';
    if (r === 'hotel') return 'Hotel Partner';
    if (r === 'experience') return 'Experience Partner';
    return role || 'User';
  };

  // SATable columns
  const tableColumns = [
    {
      key: 'name',
      label: 'User / Partner',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{val}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{row.email || 'No email provided'}</div>
        </div>
      ),
    },
    {
      key: 'userId',
      label: 'ID / Username',
      width: '130px',
      render: (val, row) => (
        <div>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
            #{val || row.username}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      align: 'center',
      render: (val) => (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 6,
            background: '#f1f5f9',
            color: '#334155',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {formatRoleLabel(val)}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Contact Phone',
      render: (val) => val || '—',
    },
    {
      key: 'location',
      label: 'Location / Region',
      render: (val, row) => val || row?.region || 'Not specified',
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val) => (
        <SABadge status={val === 'active' ? 'Active' : 'Restricted'} />
      ),
    },
  ];

  return (
    <div className="sa-users-page">
      {/* Header */}
      <div className="sa-users-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div className="sa-users-title-group">
            <h1 className="sa-users-title">User & Partner Management</h1>
            <p className="sa-users-subtitle">
              Monitor registered travelers and service partners, inspect account details, and enforce security account restrictions.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="sa-users-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <SAMetricCard
          title="Total Eligible Accounts"
          value={metrics.total}
          subtitle="Travelers and Service Partners"
          variant="primary"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        <SAMetricCard
          title="Active Accounts"
          value={metrics.active}
          subtitle="Unrestricted platform access"
          variant="success"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />

        <SAMetricCard
          title="Suspended Accounts"
          value={metrics.suspended}
          subtitle="Access blocked by Tech Admin"
          variant="warning"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          }
        />
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="sa-users-alert sa-users-alert-success" role="status">
          <span>✓ {successMessage}</span>
          <button
            type="button"
            className="sa-users-alert-close"
            onClick={() => setSuccessMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="sa-users-alert sa-users-alert-error" role="alert">
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            className="sa-users-alert-close"
            onClick={() => setErrorMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Role Navigation Tabs */}
      <div className="sa-users-tabs" role="tablist">
        {ROLE_TABS.map((tab) => {
          const count = tabCounts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              type="button"
              className={`sa-users-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
            >
              <span>{tab.label}</span>
              <span className="sa-users-tab-count">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="sa-users-toolbar">
        <div className="sa-users-toolbar-left" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="sa-users-search-box" style={{ flex: '1 1 260px' }}>
            <span className="sa-users-search-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="sa-users-search-input"
              placeholder="Search by name, ID, email, phone, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search users and partners"
            />
            {searchQuery && (
              <button
                type="button"
                className="sa-users-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="sa-users-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Suspended (Inactive)</option>
          </select>

          <span className="sa-users-table-meta">
            Showing <strong>{displayedUsers.length}</strong> of <strong>{currentTabUsers.length}</strong> accounts
          </span>
        </div>
      </div>

      {/* Data Table */}
      <SATable
        columns={tableColumns}
        data={displayedUsers}
        keyField="userId"
        isLoading={isLoading}
        emptyTitle="No Accounts Found"
        emptyMessage={
          searchQuery || statusFilter !== 'all'
            ? 'No accounts match your current filters. Try resetting your search query or status filter.'
            : 'There are currently no registered accounts under this category.'
        }
        actions={(row) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              className="sa-table-btn-action"
              onClick={() => setSelectedUserForDetails(row)}
            >
              Details
            </button>

            {row.status === 'active' ? (
              <button
                type="button"
                className="sa-table-btn-action"
                style={{ color: '#dc2626', borderColor: '#fecaca', fontWeight: 600 }}
                onClick={() => handleOpenSuspend(row)}
                title="Suspend account access"
              >
                Suspend
              </button>
            ) : (
              <button
                type="button"
                className="sa-table-btn-action"
                style={{ color: '#059669', borderColor: '#a7f3d0', fontWeight: 600 }}
                onClick={() => handleOpenReactivate(row)}
                title="Reactivate account access"
              >
                Reactivate
              </button>
            )}
          </div>
        )}
      />

      {/* DETAILS MODAL */}
      {selectedUserForDetails && (
        <div className="sa-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="sa-details-title">
          <div className="sa-modal-card" style={{ maxWidth: 520 }}>
            <div className="sa-modal-header">
              <h3 id="sa-details-title" className="sa-modal-title">
                Account Details: {selectedUserForDetails.name}
              </h3>
              <button
                type="button"
                className="sa-modal-close-btn"
                onClick={() => setSelectedUserForDetails(null)}
              >
                ✕
              </button>
            </div>

            <div className="sa-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Account Status</span>
                <SABadge status={selectedUserForDetails.status === 'active' ? 'Active' : 'Restricted'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>User ID</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>#{selectedUserForDetails.userId}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Username</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedUserForDetails.username}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Role</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatRoleLabel(selectedUserForDetails.role)}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Location / Region</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedUserForDetails.location || 'Not specified'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Email</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedUserForDetails.email || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Phone</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedUserForDetails.phone || '—'}</div>
                </div>
              </div>

              {selectedUserForDetails.status === 'inactive' && (
                <div style={{ marginTop: 10, padding: 12, background: '#fff1f2', borderRadius: 8, border: '1px solid #fecdd3' }}>
                  <div style={{ fontWeight: 600, color: '#9f1239', fontSize: 13, marginBottom: 4 }}>
                    Account Restriction Details
                  </div>
                  <div style={{ fontSize: 12, color: '#881337', marginBottom: 2 }}>
                    <strong>Reason:</strong> {selectedUserForDetails.suspensionReason || 'No reason recorded.'}
                  </div>
                  {selectedUserForDetails.suspendedAt && (
                    <div style={{ fontSize: 11, color: '#9f1239' }}>
                      <strong>Suspended At:</strong> {new Date(selectedUserForDetails.suspendedAt).toLocaleString()}
                    </div>
                  )}
                  {selectedUserForDetails.suspendedBy && (
                    <div style={{ fontSize: 11, color: '#9f1239' }}>
                      <strong>Enforced By:</strong> {selectedUserForDetails.suspendedBy}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-btn-secondary"
                onClick={() => setSelectedUserForDetails(null)}
              >
                Close
              </button>
              {selectedUserForDetails.status === 'active' ? (
                <button
                  type="button"
                  className="sa-btn-danger"
                  onClick={() => {
                    const u = selectedUserForDetails;
                    setSelectedUserForDetails(null);
                    handleOpenSuspend(u);
                  }}
                >
                  Suspend Account
                </button>
              ) : (
                <button
                  type="button"
                  className="sa-btn-primary"
                  onClick={() => {
                    const u = selectedUserForDetails;
                    setSelectedUserForDetails(null);
                    handleOpenReactivate(u);
                  }}
                >
                  Reactivate Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND CONFIRMATION DIALOG (Mandatory Reason) */}
      {suspendingUser && (
        <div className="sa-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="sa-suspend-title">
          <div className="sa-modal-card" style={{ maxWidth: 460 }}>
            <div className="sa-modal-header">
              <h3 id="sa-suspend-title" className="sa-modal-title" style={{ color: '#b91c1c' }}>
                Suspend Account Access
              </h3>
              <button
                type="button"
                className="sa-modal-close-btn"
                onClick={() => setSuspendingUser(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSuspend}>
              <div className="sa-modal-body">
                {modalError && (
                  <div className="sa-form-error" role="alert" style={{ marginBottom: 12 }}>
                    ⚠️ {modalError}
                  </div>
                )}

                <p style={{ margin: '0 0 14px 0', fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
                  Are you sure you want to <strong>suspend</strong> access for{' '}
                  <strong>{suspendingUser.name}</strong> (#{suspendingUser.userId})?
                  The user will be immediately rejected upon login and any active sessions will be invalidated.
                </p>

                <div className="sa-form-group">
                  <label className="sa-form-label" htmlFor="suspension-reason">
                    <span>Suspension Reason *</span>
                  </label>
                  <textarea
                    id="suspension-reason"
                    className="sa-form-input"
                    rows="3"
                    style={{ resize: 'vertical' }}
                    placeholder="Enter explicit reason for suspension (e.g., terms violation, fraudulent activity, security review)..."
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    required
                  />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    A non-empty suspension reason is strictly mandatory.
                  </div>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setSuspendingUser(null)}
                  disabled={modalSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-btn-danger"
                  disabled={modalSubmitting || !suspensionReason.trim()}
                >
                  {modalSubmitting ? 'Suspending...' : 'Confirm Suspension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REACTIVATE CONFIRMATION DIALOG */}
      {reactivatingUser && (
        <div className="sa-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="sa-reactivate-title">
          <div className="sa-modal-card" style={{ maxWidth: 460 }}>
            <div className="sa-modal-header">
              <h3 id="sa-reactivate-title" className="sa-modal-title" style={{ color: '#047857' }}>
                Reactivate Account Access
              </h3>
              <button
                type="button"
                className="sa-modal-close-btn"
                onClick={() => setReactivatingUser(null)}
              >
                ✕
              </button>
            </div>

            <div className="sa-modal-body">
              {modalError && (
                <div className="sa-form-error" role="alert" style={{ marginBottom: 12 }}>
                  ⚠️ {modalError}
                </div>
              )}

              <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
                Are you sure you want to <strong>reactivate</strong> account access for{' '}
                <strong>{reactivatingUser.name}</strong> (#{reactivatingUser.userId})?
                The account status will be restored to active and login access will be re-enabled.
              </p>
            </div>

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-btn-secondary"
                onClick={() => setReactivatingUser(null)}
                disabled={modalSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sa-btn-primary"
                onClick={handleConfirmReactivate}
                disabled={modalSubmitting}
              >
                {modalSubmitting ? 'Reactivating...' : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
