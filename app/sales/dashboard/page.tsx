'use client';

import { useMemo } from 'react';
import { useAppStore } from '../../../lib/store-supabase';

export default function SalesDashboardPage() {
  const getTeamAvailability = useAppStore((s) => s.getTeamAvailability);
  const getProjectMetrics = useAppStore((s) => s.getProjectMetrics);

  const availability = useMemo(() => getTeamAvailability(), [getTeamAvailability]);
  const projectMetrics = useMemo(() => getProjectMetrics(), [getProjectMetrics]);

  const totalAvailable = availability.reduce((sum, a) => sum + a.availableAllocation, 0);
  const avgAvailability = availability.length > 0 ? Math.round(totalAvailable / availability.length) : 0;

  const activeProjects = projectMetrics.filter((m) => m.status === 'active' || m.status === 'planning' || m.status === 'on_hold');
  const nextFinish = activeProjects
    .filter((m) => m.daysRemaining >= 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)[0];

  const idealStartDate = useMemo(() => {
    const today = new Date();
    if (avgAvailability >= 30) return today.toLocaleDateString();
    if (!nextFinish) return today.toLocaleDateString();
    const d = new Date();
    d.setDate(d.getDate() + Math.max(0, nextFinish.daysRemaining));
    return d.toLocaleDateString();
  }, [avgAvailability, nextFinish]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Visão Comercial</h1>
        <p className="text-sm text-gray-600">Acompanhe a operação para decidir o melhor momento de iniciar novos deals.</p>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-600">Capacidade média disponível</div>
          <div className="text-2xl font-semibold mt-1">{avgAvailability}%</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-600">Próximo término previsto</div>
          <div className="text-2xl font-semibold mt-1">{nextFinish ? `${nextFinish.daysRemaining} dia(s)` : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">{nextFinish ? nextFinish.name : 'Sem previsão'}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm text-gray-600">Data ideal p/ novo deal</div>
          <div className="text-2xl font-semibold mt-1">{idealStartDate}</div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Projetos em andamento</h2>
          <div className="text-xs text-gray-500">{activeProjects.length} projeto(s)</div>
        </div>
        <div className="space-y-3">
          {activeProjects.map((m) => (
            <div key={m.id} className="border rounded-xl p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-600">Status: {m.status}</div>
                </div>
                <div className="text-right text-sm">
                  <div>{m.progressPct.toFixed(0)}% do tempo</div>
                  <div className={m.isOnTime ? 'text-green-700' : 'text-red-700'}>
                    {m.daysRemaining >= 0 ? `${m.daysRemaining} dia(s) restantes` : 'Atrasado'}
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-gray-600">
                <div>Alocação total: {m.totalAllocation}%</div>
                <div>Custo real: R$ {m.realCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div>Variação vs orçamento: {m.budgetVariance.toFixed(1)}%</div>
              </div>
            </div>
          ))}
          {activeProjects.length === 0 && (
            <div className="text-sm text-gray-500">Sem projetos ativos.</div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Capacidade da Operação</h2>
          <div className="text-xs text-gray-500">{availability.length} pessoa(s)</div>
        </div>
        <div className="space-y-2">
          {availability.map((a) => (
            <div key={a.collaboratorId} className="grid grid-cols-4 items-center gap-3">
              <div className="truncate">
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-xs text-gray-600">{a.role}</div>
              </div>
              <div className="text-xs text-gray-600">Alocado: {a.totalAllocation}%</div>
              <div className="text-xs text-green-700">Disponível: {a.availableAllocation}%</div>
              <div className="text-xs text-gray-500 truncate">
                {a.projects.map((p) => `${p.projectName} (${p.allocation}%)`).join(' • ') || 'Sem alocações ativas'}
              </div>
            </div>
          ))}
          {availability.length === 0 && (
            <div className="text-sm text-gray-500">Sem equipe cadastrada.</div>
          )}
        </div>
      </section>
    </div>
  );
}
