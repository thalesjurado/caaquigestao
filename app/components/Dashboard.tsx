'use client';

import { useMemo } from 'react';
import { useAppStore } from '../../lib/store';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar
} from 'recharts';

function Card({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { boardActivities, okrs, collaborators } = useAppStore(s => ({
    boardActivities: s.boardActivities,
    okrs: s.okrs,
    collaborators: s.collaborators
  }));

  const doneCount = boardActivities.filter(a => a.status === 'done').length;
  const totalBoard = boardActivities.length;
  const activeProjects = okrs.length;
  const riskPct = Math.round(
    (okrs.filter(o => (o.activities?.length ?? 0) === 0).length / Math.max(1, okrs.length)) * 100
  );
  const onTimePct = 70; // placeholder

  const velocity = useMemo(() => ([
    { name: 'Sem-4', pts: 10 },
    { name: 'Sem-3', pts: 13 },
    { name: 'Sem-2', pts: 16 },
    { name: 'Sem-1', pts: 19 },
    { name: 'Esta',  pts: 20 },
  ]), []);

  const roleBuckets = useMemo(() => {
    const map = new Map<string, number>();
    okrs.forEach(o => o.activities?.forEach(a => {
      const r = collaborators.find(c => c.id === a.assigneeId)?.role ?? 'Sem função';
      map.set(r, (map.get(r) || 0) + 1);
    }));
    return Array.from(map.entries()).map(([role, value]) => ({ role, value }));
  }, [okrs, collaborators]);

  const exportJson = () => {
    const data = { boardActivities, okrs, collaborators };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'caaqui-projectops-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">Caaqui ProjectOps (MVP)</h1>
          <p className="text-sm text-gray-600">
            Sistema leve para governança de projetos, squads e OKRs.
          </p>
        </div>
        <button onClick={exportJson} className="px-3 py-2 rounded-xl border">Exportar</button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Projetos ativos" value={String(activeProjects)} />
        <Card title="No prazo (proxy)" value={`${onTimePct}%`} subtitle="Saudável + 50% Atenção" />
        <Card title="Risco/Atenção" value={`${riskPct}%`} subtitle="% dos projetos" />
        <Card title="Tarefas concluídas" value={String(doneCount)} subtitle={`${totalBoard} no board`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-4">
          <h3 className="font-medium mb-2">Velocidade (pontos/semana)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="pts" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <h3 className="font-medium mb-2">Utilização por função</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleBuckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <h3 className="font-medium mb-2">Utilização por pessoa (pontos/semana)</h3>
        <div className="space-y-2">
          {collaborators.map((c) => {
            const pts = okrs.reduce((sum, o) =>
              sum + (o.activities?.filter(a => a.assigneeId === c.id).length || 0), 0);
            const pct = Math.min(100, Math.round((pts / 15) * 100));
            return (
              <div key={c.id}>
                <div className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span>{pts} pts • {pct}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-xl">
                  <div className="h-2 rounded-xl bg-black" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {collaborators.length === 0 && (
            <div className="text-sm text-gray-500">Nenhum colaborador ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}