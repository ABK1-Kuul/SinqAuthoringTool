import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import Login from './views/Login';
import AppShell from './components/AppShell';
import Dashboard from './views/Dashboard';
import CourseEditor from './views/CourseEditor';
import AdminPortal from './views/AdminPortal';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation states: dashboard, editor, admin
  const [view, setView] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    checkSession();
    // Bind global hook for axios 401 interceptor
    window.onSessionExpired = () => {
      setUser(null);
      setView('dashboard');
      setSelectedCourseId(null);
    };
    return () => {
      window.onSessionExpired = null;
    };
  }, []);

  const checkSession = async () => {
    try {
      const profile = await api.getCurrentUser();
      if (profile && profile.email) {
        setUser(profile);
      }
    } catch (e) {
      console.warn('No active session found.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (profile) => {
    setUser(profile);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
    setSelectedCourseId(null);
  };

  const handleCourseSelected = (courseId) => {
    setSelectedCourseId(courseId);
    setView('editor');
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <h2 style={styles.loadingText}>Initializing Workspace</h2>
        <p style={styles.loadingSub}>Loading configurations, assets, and themes...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AppShell
      user={user}
      currentView={view}
      onViewChange={(v) => {
        setView(v);
        if (v !== 'editor') setSelectedCourseId(null);
      }}
      onLogout={handleLogout}
    >
      {view === 'dashboard' && (
        <Dashboard onCourseSelected={handleCourseSelected} />
      )}
      
      {view === 'editor' && selectedCourseId && (
        <CourseEditor
          courseId={selectedCourseId}
          user={user}
          onBack={() => {
            setView('dashboard');
            setSelectedCourseId(null);
          }}
        />
      )}

      {view === 'admin' && (
        <AdminPortal />
      )}
    </AppShell>
  );
}

const styles = {
  loadingScreen: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    gap: '16px',
  },
  spinner: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: '3px solid var(--border-color)',
    borderTopColor: 'var(--accent-color)',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  loadingSub: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
};
