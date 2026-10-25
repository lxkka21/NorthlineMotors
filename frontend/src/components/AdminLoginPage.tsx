import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { SessionResponse } from '../types/api';

interface AdminLoginPageProps { onAuthenticated: (session: SessionResponse) => void; login: (email: string, password: string) => Promise<SessionResponse>; }

export function AdminLoginPage({ onAuthenticated, login }: AdminLoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [show, setShow] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!email.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 12) return setError('Enter your password.');
    setLoading(true);
    try {
      const session = await login(email, password);
      if (session.user.role !== 'admin') { setError('This portal is available to administrators only.'); return; }
      onAuthenticated(session); navigate('/admin/dashboard');
    } catch { setError('Unable to sign in to the administrator portal.'); }
    finally { setLoading(false); }
  }
  return <main className="admin-login-shell"><section className="admin-login-panel"><p className="eyebrow accent">Northline Motors / secured access</p><div className="admin-wordmark"><span className="wordmark-mark">N</span><span>Northline<br /><em>Admin Portal</em></span></div><h1>Operate the line.</h1><p>Inventory, people, and orders in one protected workspace.</p><form onSubmit={submit} className="auth-form"><label>Email<input aria-label="Admin email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label><label>Password<div className="password-field"><input aria-label="Admin password" type={show ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /><button type="button" onClick={() => setShow((current) => !current)}>{show ? 'Hide' : 'Show'}</button></div></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Checking access…' : 'Enter admin dashboard'}</button></form><Link className="admin-back-link" to="/">← Return to customer website</Link></section></main>;
}
