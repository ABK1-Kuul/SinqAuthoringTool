import React, { useState, useEffect } from 'react';
import { Shield, Users, Server, Plus, UserPlus, ToggleLeft, ToggleRight, Lock, Check } from 'lucide-react';
import { api } from '../utils/api';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('tenants'); // tenants, users, system
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Tenant modal
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantDomain, setTenantDomain] = useState('');
  const [tenantLoading, setTenantLoading] = useState(false);

  // Create User modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tenants') {
        const data = await api.getTenants();
        setTenants(data || []);
      } else if (activeTab === 'users') {
        const data = await api.getUsers();
        setUsers(data || []);
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    if (!tenantName) return;
    setTenantLoading(true);
    try {
      await api.createTenant({
        name: tenantName,
        domain: tenantDomain || `${tenantName.toLowerCase().replace(/\s+/g, '')}.sinq.com`
      });
      loadData();
      setTenantModalOpen(false);
      setTenantName('');
      setTenantDomain('');
    } catch (e) {
      console.error(e);
      alert('Failed to register tenant subscription.');
    } finally {
      setTenantLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userEmail || !userPassword) return;
    setUserLoading(true);
    try {
      await api.createUser({
        email: userEmail,
        password: userPassword,
        roles: ['contentcreator']
      });
      loadData();
      setUserModalOpen(false);
      setUserEmail('');
      setUserPassword('');
    } catch (e) {
      console.error(e);
      alert('Failed to register workspace user.');
    } finally {
      setUserLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>System Administration Control</h1>
          <p style={styles.subtitle}>Manage your organization subscriptions, tenant allocations, and users.</p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div style={styles.tabBar}>
        <button 
          onClick={() => setActiveTab('tenants')} 
          style={{...styles.tab, ...(activeTab === 'tenants' ? styles.activeTab : {})}}
        >
          <Server size={16} />
          <span>Subscriber Tenants</span>
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{...styles.tab, ...(activeTab === 'users' ? styles.activeTab : {})}}
        >
          <Users size={16} />
          <span>Workspace Users</span>
        </button>
      </div>

      {/* Main Table views */}
      <div style={styles.body}>
        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <span>Syncing database parameters...</span>
          </div>
        ) : activeTab === 'tenants' ? (
          /* Tenants List */
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3>Active Tenant Subscriptions</h3>
              <button onClick={() => setTenantModalOpen(true)} style={styles.actionBtn}>
                <Plus size={16} />
                <span>Register Tenant</span>
              </button>
            </div>
            
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Domain mapping</th>
                  <th style={styles.th}>Subscription status</th>
                  <th style={styles.th}>Master Tenant</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t._id} style={styles.tr}>
                    <td style={{...styles.td, fontWeight: '600'}}>{t.name}</td>
                    <td style={styles.td}>{t.domain || 'N/A'}</td>
                    <td style={styles.td}>
                      <span style={styles.statusBadge}>Active</span>
                    </td>
                    <td style={styles.td}>
                      {t.isMaster ? <Check size={16} style={{color: 'var(--color-success)'}} /> : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Users List */
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3>Registered Organization Users</h3>
              <button onClick={() => setUserModalOpen(true)} style={styles.actionBtn}>
                <UserPlus size={16} />
                <span>Register User</span>
              </button>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Email address</th>
                  <th style={styles.th}>Roles</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Login Attempts</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={styles.tr}>
                    <td style={{...styles.td, fontWeight: '600'}}>{u.email}</td>
                    <td style={styles.td}>
                      {u.roles?.map(roleId => (
                        <span key={roleId} style={styles.roleBadge}>
                          {roleId === '6a50d0c9ff9dd79f99a6fd82' ? 'Super Admin' : 'Creator'}
                        </span>
                      ))}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: u.failedLoginCount > 3 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: u.failedLoginCount > 3 ? 'var(--color-danger)' : 'var(--color-success)'
                      }}>
                        {u.failedLoginCount > 3 ? 'Locked' : 'Active'}
                      </span>
                    </td>
                    <td style={styles.td}>{u.failedLoginCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tenant Creation Modal */}
      {tenantModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>Register Tenant Organization</h2>
            <form onSubmit={handleCreateTenant} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tenant/Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Domain Mapping Prefix</label>
                <input
                  type="text"
                  placeholder="e.g. acme"
                  value={tenantDomain}
                  onChange={(e) => setTenantDomain(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setTenantModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" disabled={tenantLoading} style={styles.submitBtn}>
                  {tenantLoading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Creation Modal */}
      {userModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>Register Workspace Account</h2>
            <form onSubmit={handleCreateUser} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="creator@company.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" disabled={userLoading} style={styles.submitBtn}>
                  {userLoading ? 'Registering...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
  },
  tabBar: {
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '24px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 18px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
  },
  activeTab: {
    color: 'var(--accent-color)',
    borderBottomColor: 'var(--accent-color)',
  },
  body: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '24px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    color: 'var(--text-secondary)',
    gap: '12px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid var(--border-color)',
    borderTopColor: 'var(--accent-color)',
    animation: 'spin 1s linear infinite',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
    transition: 'var(--transition-smooth)',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '12px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: 'var(--color-success)',
    fontSize: '11px',
    fontWeight: '600',
  },
  roleBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    marginRight: '6px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: 'var(--shadow-lg)',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
  cancelBtn: {
    padding: '10px 18px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 18px',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
