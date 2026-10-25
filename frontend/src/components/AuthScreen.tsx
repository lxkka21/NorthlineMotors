import { useState, type FormEvent } from 'react';
import type { SessionResponse } from '../types/api';

interface AuthScreenProps {
  onAuthenticated: (session: SessionResponse) => void;
  request: (mode: 'login' | 'register', email: string, password: string) => Promise<SessionResponse>;
}

export function AuthScreen({ onAuthenticated, request }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!email.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 12) return setError('Password must be at least 12 characters.');
    setLoading(true);
    try {
      onAuthenticated(await request(mode, email, password));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to authenticate.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08111f] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.28em] text-amber-300">Northline Motors</p>
          <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-tight sm:text-7xl">A sharper view of every vehicle on your lot.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">An inventory workspace for dealership teams who want clarity from showroom floor to stockroom.</p>
        </section>
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/30 backdrop-blur sm:p-9">
          <div className="mb-8 flex rounded-xl bg-black/20 p-1">
            {(['login', 'register'] as const).map((item) => (
              <button key={item} type="button" onClick={() => { setMode(item); setError(''); }} className={`flex-1 rounded-lg px-4 py-3 text-sm font-bold capitalize transition ${mode === item ? 'bg-amber-300 text-slate-950' : 'text-slate-300 hover:bg-white/10'}`}>
                {item}
              </button>
            ))}
          </div>
          <h2 className="text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-sm text-slate-400">{mode === 'login' ? 'Sign in to your dealership workspace.' : 'Start managing your inventory in minutes.'}</p>
          <form className="mt-7 space-y-5" onSubmit={submit}>
            <label className="block text-sm font-semibold text-slate-200">Email<input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-amber-300 transition focus:ring-2" /></label>
            <label className="block text-sm font-semibold text-slate-200">Password<input aria-label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-amber-300 transition focus:ring-2" /></label>
            {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
            <button disabled={loading} className="w-full rounded-xl bg-amber-300 px-4 py-3.5 font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Working…' : mode === 'login' ? 'Enter workspace' : 'Create account'}</button>
          </form>
        </section>
      </div>
    </main>
  );
}

