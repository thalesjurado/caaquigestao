'use client';

import { useEffect, useState, useCallback } from 'react';
import { loadFromServer, saveToServer, useLoadOnFocus, type ServerData } from '../lib/sync';
import { toast } from '../lib/toast';
import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('./components/Dashboard'), { ssr: false });
const Board = dynamic(() => import('./components/Board'), { ssr: false });
const OKRs = dynamic(() => import('./components/OKRs'), { ssr: false });
const Rituais = dynamic(() => import('./components/Rituais'), { ssr: false });
const Team = dynamic(() => import('./components/Team'), { ssr: false });

type Tab = 'dashboard' | 'board' | 'team' | 'okrs' | 'rituais';

export default function Page() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [data, setData] = useState<ServerData | null>(null);

  // define o handler primeiro
  const reload = useCallback(async () => {
    const res = await loadFromServer('default');
    setData(res);
  }, []);

  // carrega na montagem
  useEffect(() => {
    reload();
  }, [reload]);

  // agora sim: passa a função para o hook
  useLoadOnFocus(reload);

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
      <div className="flex justify-end gap-2">
        <button className="px-3 py-2 rounded-xl border" onClick={reload}>
          Atualizar
        </button>
        <button
          className="px-3 py-2 rounded-xl border"
          onClick={() => {
            saveToServer('default', { ping: Date.now() });
            toast.success('Dados salvos no servidor');
          }}
        >
          Salvar
        </button>
      </div>

      <section className="mb-4">
        <div className="flex flex-wrap gap-2 md:space-x-2 md:gap-0">
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

      {data && (
        <pre className="rounded bg-gray-50 p-3 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
