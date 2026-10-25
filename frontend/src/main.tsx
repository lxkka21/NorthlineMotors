import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function App() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
          Inventory system
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Car dealership inventory, ready for the next feature.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          The React, Vite and Tailwind frontend is connected to the project workspace. Business
          operations will be added through the Express API in the next phase.
        </p>
        <div className="mt-10 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-cyan-200">
          Backend health endpoint: <span className="ml-2 font-semibold">/api/health</span>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

