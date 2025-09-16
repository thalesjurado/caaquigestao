'use client';

// import { useAppStore } from '@/lib/store-supabase';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DataLoader from './components/DataLoader';
import ToastContainer from './components/ToastContainer';

const Dashboard = dynamic(() => import('./components/Dashboard'), { ssr: false });
const Projects = dynamic(() => import('./components/Projects'), { ssr: false });
const Board = dynamic(() => import('./components/Board'), { ssr: false });
const OKRs = dynamic(() => import('./components/OKRs'), { ssr: false });
const Rituais = dynamic(() => import('./components/Rituais'), { ssr: false });
const Team = dynamic(() => import('./components/Team'), { ssr: false });
const TeamAvailability = dynamic(() => import('./components/TeamAvailability'), { ssr: false });
const ProjectTimeline = dynamic(() => import('./components/ProjectTimeline'), { ssr: false });

type Tab = 'dashboard' | 'projects' | 'board' | 'team' | 'availability' | 'timeline' | 'okrs' | 'rituais';

export default function Page() {
  const [tab, setTab] = useState<Tab>('dashboard');

  // Navegação por URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as Tab;
      if (hash && ['dashboard', 'projects', 'board', 'team', 'availability', 'timeline', 'okrs', 'rituais'].includes(hash)) {
        setTab(hash);
      }
    };

    // Verificar hash inicial
    handleHashChange();
    
    // Escutar mudanças no hash
    window.addEventListener('hashchange', handleHashChange);
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    window.location.hash = newTab;
  };

  const TabBtn = ({ id, label }: { id: Tab; label: string }) => (
    <button
      onClick={() => handleTabChange(id)}
      className={`px-3 py-2 rounded-xl border text-sm md:text-base ${
        tab === id
          ? 'bg-blue-500 text-white border-blue-500'
          : 'bg-transparent text-blue-500 border-blue-200 hover:bg-blue-50'
      } transition-colors duration-200`}
    >
      {label}
    </button>
  );

  return (
    <DataLoader>
      <main className="max-w-6xl mx-auto p-6 space-y-10">
        <section className="mb-4">
          <div className="flex flex-wrap gap-2 md:space-x-2 md:gap-0">
            <TabBtn id="dashboard" label="📊 Dashboard" />
            <TabBtn id="projects" label="🚀 Projetos" />
            <TabBtn id="board" label="📋 Board" />
            <TabBtn id="availability" label="👥 Disponibilidade" />
            <TabBtn id="timeline" label="📅 Timeline" />
            <TabBtn id="okrs" label="🎯 OKRs" />
            <TabBtn id="rituais" label="⚡ Rituais" />
            <TabBtn id="team" label="👨‍💼 Equipe" />
          </div>
        </section>

        <section>
        {tab === 'dashboard' && (
          <>
            <h2 className="text-2xl font-bold mb-3">Dashboard</h2>
            <Dashboard />
          </>
        )}


        {tab === 'projects' && (
          <>
            <Projects />
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

        {tab === 'availability' && (
          <>
            <TeamAvailability />
          </>
        )}

        {tab === 'timeline' && (
          <>
            <ProjectTimeline />
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
