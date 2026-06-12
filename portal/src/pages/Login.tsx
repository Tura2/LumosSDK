import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const nav = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('lumos_token', res.data.token);
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
      localStorage.setItem('lumos_token', res.data.token);
      nav('/');
    } catch {
      setError('Registration failed — email may already be taken');
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f1a' }}>
      <form onSubmit={handleSubmit} style={{ background: '#1a1a2e', padding: 40, borderRadius: 12, width: 360 }}>
        <h2 style={{ color: '#fff', marginBottom: 24 }}>⚡ Lumos</h2>
        {error && <p style={{ color: '#e94560' }}>{error}</p>}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
          style={inputStyle} type="email" required />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
          style={inputStyle} type="password" required />
        <button type="submit" style={btnStyle}>Sign in</button>
        <p style={{ color: '#888', marginTop: 12, fontSize: 13 }}>
          No account?{' '}
          <button type="button" onClick={handleRegister}
            style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer' }}>
            Register
          </button>
        </p>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', marginBottom: 12, borderRadius: 6,
  border: '1px solid #333', background: '#0f0f1a', color: '#fff', boxSizing: 'border-box',
};
const btnStyle: React.CSSProperties = {
  width: '100%', padding: '12px', background: '#e94560', border: 'none',
  borderRadius: 6, color: '#fff', fontWeight: 600, cursor: 'pointer',
};
