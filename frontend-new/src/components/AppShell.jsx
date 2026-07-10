import React, { useState } from 'react';
import { Layout, LogOut, ShieldAlert, Palette, BookOpen, User, Sun, Moon } from 'lucide-react';
import { api } from '../utils/api';

export default function AppShell({ user, currentView, onViewChange, onLogout, children }) {
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark'); // dark, light, emerald, sunset

  const changeTheme = (newTheme) => {
    const root = document.documentElement;
    root.className = ''; // reset classes
    if (newTheme !== 'dark') {
      root.classList.add(`theme-${newTheme}`);
    }
    setTheme(newTheme);
    setThemeMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error(e);
    }
    onLogout();
  };

  const isSuperAdmin = user?.roles?.includes('6a50d0c9ff9dd79f99a6fd82') || user?.email === 'admin@sinq.com';

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoSymbol}>S</div>
          <span style={styles.logoText}>SINQ</span>
        </div>

        <nav style={styles.nav}>
          <button
            onClick={() => onViewChange('dashboard')}
            style={{
              ...styles.navItem,
              ...(currentView === 'dashboard' || currentView === 'editor' ? styles.activeNavItem : {})
            }}
          >
            <BookOpen size={18} />
            <span>Courses</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => onViewChange('admin')}
              style={{
                ...styles.navItem,
                ...(currentView === 'admin' ? styles.activeNavItem : {})
              }}
            >
              <ShieldAlert size={18} />
              <span>Admin Portal</span>
            </button>
          )}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              <User size={16} />
            </div>
            <div style={styles.userMeta}>
              <span style={styles.userName}>{user?.email?.split('@')[0]}</span>
              <span style={styles.userRole}>{isSuperAdmin ? 'Super Admin' : 'Creator'}</span>
            </div>
          </div>

          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={styles.main}>
        {/* Topbar */}
        <header style={styles.topbar}>
          <div style={styles.topbarPath}>
            <span style={styles.pathHome}>Workspace</span>
            <span style={styles.pathSeparator}>/</span>
            <span style={styles.pathActive}>
              {currentView === 'dashboard' && 'Courses'}
              {currentView === 'editor' && 'Course Outline Editor'}
              {currentView === 'admin' && 'Admin Portal'}
            </span>
          </div>

          <div style={styles.topbarActions}>
            {/* Theme selector */}
            <div style={styles.themeSelectorContainer}>
              <button onClick={() => setThemeMenuOpen(!themeMenuOpen)} style={styles.themeBtn}>
                <Palette size={18} />
                <span>Theme</span>
              </button>

              {themeMenuOpen && (
                <div style={styles.themeDropdown}>
                  <button onClick={() => changeTheme('dark')} style={styles.dropdownItem}>
                    <Moon size={14} />
                    <span>Obsidian Slate</span>
                  </button>
                  <button onClick={() => changeTheme('light')} style={styles.dropdownItem}>
                    <Sun size={14} />
                    <span>Clean Light</span>
                  </button>
                  <button onClick={() => changeTheme('emerald')} style={styles.dropdownItem}>
                    <div style={{...styles.colorIndicator, backgroundColor: '#10b981'}} />
                    <span>Emerald Glass</span>
                  </button>
                  <button onClick={() => changeTheme('sunset')} style={styles.dropdownItem}>
                    <div style={{...styles.colorIndicator, backgroundColor: '#f97316'}} />
                    <span>Sunset Glow</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic page contents */}
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
  },
  sidebar: {
    width: '240px',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    zIndex: 10,
  },
  sidebarHeader: {
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  logoSymbol: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--accent-text)',
    fontSize: '18px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
  },
  nav: {
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexGrow: 1,
  },
  navItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'var(--transition-smooth)',
  },
  activeNavItem: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    borderLeft: '3px solid var(--accent-color)',
    borderRadius: '0 var(--border-radius-md) var(--border-radius-md) 0',
    paddingLeft: '13px',
  },
  sidebarFooter: {
    padding: '20px 12px',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '4px 8px',
  },
  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-primary)',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  userRole: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--color-danger)',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'var(--transition-smooth)',
  },
  main: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  topbar: {
    height: '64px',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
  },
  topbarPath: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  pathHome: {
    color: 'var(--text-muted)',
  },
  pathSeparator: {
    color: 'var(--text-muted)',
  },
  pathActive: {
    color: 'var(--text-primary)',
    fontWeight: '500',
  },
  topbarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  themeSelectorContainer: {
    position: 'relative',
  },
  themeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  themeDropdown: {
    position: 'absolute',
    top: '44px',
    right: 0,
    width: '180px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-md)',
    boxShadow: 'var(--shadow-lg)',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    zIndex: 100,
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'var(--transition-smooth)',
  },
  colorIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    backgroundColor: 'var(--bg-primary)',
  },
};
