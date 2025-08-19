'use client';

import { useState } from 'react';
import Board from './components/Board';
import OKRs from './components/OKRs';
import Rituais from './components/Rituais';
import Team from './components/Team';
import Dashboard from './components/Dashboard';

type Tab = 'dashboard' | 'board' | 'team' | 'okrs' | 'rituais';

export default function Page() {
  const [tab, setTab] = useState<Tab>('dashboard');

  const TabBtn = ({ id, label }: { id: Tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 py-2 rounded-xl border ${
        tab === id
          ? 'bg-blue-500 text-white'
          : 'bg-transparent text-blue-500'
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-10">
      <section className="mb-4">
        <div className="flex space-x-2">
          <TabBtn id="dashboard" label="Dashboard" />
          <TabBtn id="board" label="Board" />
          <TabBtn id="okrs" label="OKRs" />
          <TabBtn id="rituais" label="Rituais" />
          <TabBtn id="team" label="Equipe" />
        </div>
      </section>

      <section>
        {tab === 'dashboard' && (
          <>
            <h2 className="text-2xl font-bold mb-3">Dashboard</h2>
            <Dashboard />
          </>
        )}

        {tab === 'board' && (
          <>
            <h2 className="text-2xl font-bold mb-3">Board</h2>
            <Board />
          </>
        )}

        {tab === 'okrs' && (
          <>
            <h2 className="text-2xl font-bold mb-3">OKRs</h2>
            <OKRs />
          </>
        )}

        {tab === 'rituais' && (
          <>
            <h2 className="text-2xl font-bold mb-3">OKRs & Rituais — Rituais</h2>
            <Rituais />
          </>
        )}

        {tab === 'team' && (
          <>
            <h2 className="text-2xl font-bold mb-3">Equipe</h2>
            <Team />
          </>
        )}
      </section>
    </main>
  );
}
