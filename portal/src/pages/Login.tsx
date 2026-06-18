import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { T, cardStyle, gradientText } from '../theme';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const nav = useNavigate();
  const { setToken } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      setToken(res.data.token);
      nav('/');
    } catch {
      setError('Invalid email or password');
    }
  }

  async function handleRegister() {
    setError('');
    try {
      await api.post('/api/auth/register', { email, password });
      const res = await api.post('/api/auth/login', { email, password });
      setToken(res.data.token);
      nav('/');
    } catch {
      setError('Registration failed — email may already be taken');
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '100%', minHeight: '100vh',
      background: T.bg, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '25%',
        width: 600, height: 600,
        background: 'radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '20%',
        width: 450, height: 450,
        background: 'radial-gradient(ellipse, rgba(123,95,255,0.06) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <form
        onSubmit={handleSubmit}
        style={{
          ...cardStyle,
          padding: '40px',
          width: 400,
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.08)',
          position: 'relative', zIndex: 1,
        }}
      >
        {/* Brand */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: T.grad,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Sparkles size={18} color="#fff" strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, ...gradientText }}>LumosSDK</span>
          </div>
          <p style={{ color: T.muted, fontSize: 13, paddingLeft: 46 }}>AI observability platform</p>
        </div>

        <h2 style={{ color: T.text, fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
          Sign in to your account
        </h2>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: T.red, fontSize: 13, marginBottom: 16,
            background: 'rgba(255,69,99,0.08)',
            border: '1px solid rgba(255,69,99,0.2)',
            borderRadius: 8, padding: '10px 12px',
          }}>
            <AlertCircle size={14} strokeWidth={1.5} />
            {error}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label htmlFor="email" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
            Email address
          </label>
          <input
            id="email"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={inputStyle} type="email" required
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label htmlFor="password" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.muted, marginBottom: 6 }}>
            Password
          </label>
          <input
            id="password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle} type="password" required
          />
        </div>

        <button type="submit" style={btnStyle}>Sign in</button>

        <p style={{ color: T.muted, marginTop: 16, fontSize: 13, textAlign: 'center' }}>
          No account?{' '}
          <button
            type="button"
            onClick={handleRegister}
            style={{ background: 'none', border: 'none', color: T.cyan, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
          >
            Register
          </button>
        </p>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: `1px solid ${T.border}`, background: T.bg, color: T.text,
  fontSize: 14, outline: 'none', transition: 'border-color 200ms ease-out',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  width: '100%', padding: '12px', background: T.grad, border: 'none',
  borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer',
  fontSize: 15, minHeight: 44,
};
