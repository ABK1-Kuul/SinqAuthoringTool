import React, { useState } from 'react';
import { api } from '../utils/api';
import { Mail, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.login(email, password);
      // Fetch user profile after successful login
      const user = await api.getCurrentUser();
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email address or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundGlow} />
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoSymbol}>S</div>
          <h1 style={styles.logoText}>SINQ <span style={styles.logoSubText}>AUTHORING</span></h1>
        </div>
        <p style={styles.subtitle}>Welcome back! Sign in to continue building.</p>

        {error && (
          <div style={styles.errorAlert}>
            <AlertTriangle size={18} style={styles.alertIcon} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                placeholder="admin@sinq.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Need help? Contact support or reset your password.</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-primary)',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  backgroundGlow: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, var(--accent-glow) 0%, rgba(0,0,0,0) 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1,
    filter: 'blur(50px)',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
    borderRadius: 'var(--border-radius-lg)',
    backgroundColor: 'var(--bg-glass)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-lg)',
    backdropFilter: 'blur(16px)',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeIn 0.5s ease-out',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  logoSymbol: {
    width: '42px',
    height: '42px',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--accent-text)',
    fontSize: '24px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 15px var(--accent-glow)',
  },
  logoText: {
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '-1px',
  },
  logoSubText: {
    color: 'var(--accent-color)',
    fontSize: '12px',
    fontWeight: '600',
    display: 'block',
    letterSpacing: '2px',
    marginTop: '-4px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginBottom: '28px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--color-danger)',
    fontSize: '14px',
    marginBottom: '20px',
  },
  alertIcon: {
    flexShrink: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 14px 12px 42px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    transition: 'var(--transition-smooth)',
  },
  eyeButton: {
    position: 'absolute',
    right: '14px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px var(--accent-glow)',
    transition: 'var(--transition-smooth)',
    marginTop: '10px',
  },
  footer: {
    marginTop: '28px',
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
};
