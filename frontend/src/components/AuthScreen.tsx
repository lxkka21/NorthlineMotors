import { useState, type FormEvent } from 'react';
import type { RegistrationInput, SessionResponse } from '../types/api';

interface AuthScreenProps {
  onAuthenticated: (session: SessionResponse) => void;
  request: (mode: 'login' | 'register', input: { email: string; password: string } | RegistrationInput) => Promise<SessionResponse>;
}

const showroomImage = 'https://images.unsplash.com/photo-1660108407012-22a8af96e999?auto=format&fit=crop&w=1600&q=85';

export function AuthScreen({ onAuthenticated, request }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<'email' | 'phone' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (mode === 'register' && !fullName.trim()) return setError('Enter your full name.');
    if (!email.includes('@')) return setError('Enter a valid email address.');
    if (mode === 'register' && !/^\+?[0-9\s().-]{7,25}$/.test(phone.trim())) return setError('Enter a valid phone number.');
    if (password.length < 12) return setError('Password must be at least 12 characters.');
    if (mode === 'register' && password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const input = mode === 'login' ? { email, password } : { fullName, email, phone, password, confirmPassword, dateOfBirth: dateOfBirth || undefined, addressLine: addressLine || undefined, city: city || undefined, state: state || undefined, postalCode: postalCode || undefined, preferredContactMethod: preferredContactMethod || undefined };
      onAuthenticated(await request(mode, input));
    }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to authenticate.'); }
    finally { setLoading(false); }
  }

  return (
    <main className="auth-shell">
      <section className="auth-editorial" style={{ backgroundImage: `linear-gradient(90deg, rgba(8, 12, 16, .95) 0%, rgba(8, 12, 16, .58) 55%, rgba(8, 12, 16, .12) 100%), url(${showroomImage})` }}>
        <div className="auth-editorial-content">
          <div className="wordmark"><span className="wordmark-mark">N</span><span>Northline<br /><em>Motors</em></span></div>
          <div className="auth-copy"><p className="eyebrow">The considered collection</p><h1>Drive the<br /><span>difference.</span></h1><p>One clear view of every vehicle, every conversation, and every decision on the lot.</p></div>
          <p className="auth-credit">Showroom / Northline collection</p>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <p className="eyebrow accent">Inventory command center</p>
          <div className="auth-switcher" aria-label="Authentication mode">
            {(['login', 'register'] as const).map((item) => <button key={item} type="button" aria-label={item} onClick={() => { setMode(item); setError(''); }} className={mode === item ? 'active' : ''}>{item === 'login' ? 'Sign in' : 'Create account'}</button>)}
          </div>
          <h2>{mode === 'login' ? 'Welcome back.' : 'Join the line-up.'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Access your dealership workspace.' : 'Your new inventory workspace starts here.'}</p>
          <form className="auth-form detailed-auth-form" onSubmit={submit}>
            {mode === 'register' && <fieldset><legend>Personal details</legend><label>Full name<input aria-label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" /></label><label>Date of birth <span>(optional)</span><input aria-label="Date of birth" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} /></label></fieldset>}
            <fieldset><legend>Contact information</legend><label>Email<input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@northline.com" autoComplete="email" /></label>{mode === 'register' && <><label>Phone<input aria-label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 63665 82056" autoComplete="tel" /></label><div className="auth-two-col"><label>Address line <span>(optional)</span><input aria-label="Address line" value={addressLine} onChange={(event) => setAddressLine(event.target.value)} /></label><label>City <span>(optional)</span><input aria-label="City" value={city} onChange={(event) => setCity(event.target.value)} /></label><label>State <span>(optional)</span><input aria-label="State" value={state} onChange={(event) => setState(event.target.value)} /></label><label>Postal code <span>(optional)</span><input aria-label="Postal code" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} /></label></div><label>Preferred contact <span>(optional)</span><select aria-label="Preferred contact method" value={preferredContactMethod} onChange={(event) => setPreferredContactMethod(event.target.value as 'email' | 'phone' | '')}><option value="">Choose a preference</option><option value="email">Email</option><option value="phone">Phone</option></select></label></>}</fieldset>
            <fieldset><legend>Account security</legend><label>Password<div className="password-field"><input aria-label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="12 characters minimum" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>{mode === 'register' && <><p className="password-requirements">Use at least 12 characters. A long phrase is recommended.</p><label>Confirm password<div className="password-field"><input aria-label="Confirm password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Hide' : 'Show'}</button></div></label></>}</fieldset>
            {error && <p role="alert" className="form-error">{error}</p>}
            <button disabled={loading} className="primary-button">{loading ? 'Working…' : mode === 'login' ? 'Enter workspace' : 'Create account'}</button>
          </form>
          {mode === 'register' && <p className="auth-note">New accounts begin as Customer access. An administrator can grant Sales access later.</p>}
          {mode === 'login' && <p className="auth-note"><a className="text-link" href="/admin/login">Administrator portal →</a></p>}
        </div>
      </section>
    </main>
  );
}
