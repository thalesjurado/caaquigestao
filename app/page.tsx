'use client';

import { useAppStore } from '@/lib/store-fallback';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import DataLoader from './components/DataLoader';

const Dashboard = dynamic(() => import('./components/Dashboard'), { ssr: false });
const Projetos = dynamic(() => import('./components/Projetos'), { ssr: false });
const Board = dynamic(() => import('./components/Board'), { ssr: false });
const OKRs = dynamic(() => import('./components/OKRs'), { ssr: false });
const Rituais = dynamic(() => import('./components/Rituais'), { ssr: false });
const Team = dynamic(() => import('./components/Team'), { ssr: false });

type Tab = 'dashboard' | 'projetos' | 'board' | 'team' | 'okrs' | 'rituais';

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
    <DataLoader>
      <main className="max-w-6xl mx-auto p-6 space-y-10">
        <section className="mb-4">
          <div className="flex flex-wrap gap-2 md:space-x-2 md:gap-0">
            <TabBtn id="dashboard" label="Dashboard" />
            <TabBtn id="projetos" label="Projetos" />
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

        {tab === 'projetos' && (
          <>
            <h2 className="text-2xl font-bold mb-3">Projetos</h2>
            <Projetos />
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
    </DataLoader>
  );
}
