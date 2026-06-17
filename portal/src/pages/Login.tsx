import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { T, cardStyle, gradientText } from '../theme';

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: T.bg }}>
      <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 40, width: 360 }}>
        <h2 style={{ ...gradientText, marginBottom: 8, fontSize: 28, fontWeight: 800 }}>Lumos</h2>
        <p style={{ color: T.muted, marginBottom: 28, fontSize: 14 }}>AI observability platform</p>
        {error && <p style={{ color: T.red, marginBottom: 12, fontSize: 14 }}>{error}</p>}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
          style={inputStyle} type="email" required />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
          style={inputStyle} type="password" required />
        <button type="submit" style={btnStyle}>Sign in</button>
        <p style={{ color: T.muted, marginTop: 16, fontSize: 13, textAlign: 'center' }}>
          No account?{' '}
          <button type="button" onClick={handleRegister}
            style={{ background: 'none', border: 'none', color: T.cyan, cursor: 'pointer', fontSize: 13 }}>
            Register
          </button>
        </p>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', marginBottom: 12, borderRadius: 8,
  border: `1px solid ${T.border}`, background: T.bg, color: T.text,
  boxSizing: 'border-box', fontSize: 14, outline: 'none',
};
const btnStyle: React.CSSProperties = {
  width: '100%', padding: '12px', background: T.grad, border: 'none',
  borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15,
};
