'use client';

import { useMemo, useEffect } from 'react';
import { useAppStore } from '../../lib/store-supabase';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar
} from 'recharts';
import ProjectNotifications from './ProjectNotifications';

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
  const { boardActivities, okrs, collaborators, projects, getProjectMetrics } = useAppStore(s => ({
    boardActivities: s.boardActivities,
    okrs: s.okrs,
    collaborators: s.collaborators,
    projects: s.projects,
    getProjectMetrics: s.getProjectMetrics
  }));

  // Force re-render when board activities change to ensure real-time sync
  useEffect(() => {
    // This effect will trigger whenever boardActivities change
    // ensuring the Dashboard metrics update in real-time
  }, [boardActivities, projects]);

  const doneCount = boardActivities.filter(a => a.status === 'done').length;
  const totalBoard = boardActivities.length;

  // Métricas baseadas nos novos projetos
  const projectMetrics = useMemo(() => getProjectMetrics(), [getProjectMetrics]);
  
  const activeProjects = useMemo(() => {
    return projects.filter(p => p.status === 'active').length;
  }, [projects]);

  // No prazo = % de projetos que estão dentro do prazo
  const onTimePct = useMemo(() => {
    if (projectMetrics.length === 0) return 100;
    const onTimeCount = projectMetrics.filter(p => p.isOnTime).length;
    return Math.round((onTimeCount / projectMetrics.length) * 100);
  }, [projectMetrics]);

  // Projetos em risco = projetos atrasados ou com baixo progresso
  const riskPct = useMemo(() => {
    if (projectMetrics.length === 0) return 0;
    const riskCount = projectMetrics.filter(p => !p.isOnTime || p.daysRemaining < 0).length;
    return Math.round((riskCount / projectMetrics.length) * 100);
  }, [projectMetrics]);

  // Velocidade baseada em tarefas concluídas por semana (dados reais)
  const velocity = useMemo(() => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      const weekTasks = boardActivities.filter(a => {
        if (!a.createdAt || a.status !== 'done') return false;
        const taskDate = new Date(a.createdAt);
        return taskDate >= weekStart && taskDate < weekEnd;
      });
      
      const weekLabel = i === 0 ? 'Esta' : `Sem-${i}`;
      const points = weekTasks.reduce((sum, task) => sum + (task.points || 1), 0);
      
      weeks.push({ name: weekLabel, pts: points });
    }
    
    return weeks;
  }, [boardActivities]);

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

      {/* Notificações de Projetos */}
      <ProjectNotifications />

      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Projetos ativos" value={String(activeProjects)} />
        <Card title="No prazo" value={`${onTimePct}%`} subtitle="Projetos dentro do cronograma" />
        <Card title="Risco/Atenção" value={`${riskPct}%`} subtitle="Projetos atrasados ou em risco" />
        <Card title="Tarefas concluídas" value={String(doneCount)} subtitle={`${totalBoard} no board`} />
      </div>

      {/* Custos dos Projetos */}
      <div className="rounded-2xl border p-4">
        <h3 className="font-medium mb-4">Custos dos Projetos Ativos</h3>
        <div className="space-y-3">
          {projectMetrics
            .filter(p => p.status === 'active')
            .map(project => (
              <div key={project.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{project.name}</span>
                    <div className="text-xs text-gray-600">
                      {project.daysRemaining > 0 ? `${project.daysRemaining} dias restantes` : 'Atrasado'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      R$ {project.realCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs ${
                      project.budgetVariance > 10 ? 'text-red-600' :
                      project.budgetVariance > 0 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {project.budgetVariance > 0 ? '+' : ''}{project.budgetVariance.toFixed(1)}% do orçamento
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Progresso: {project.progressPct.toFixed(1)}%
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    !project.isOnTime ? 'bg-red-100 text-red-800' :
                    project.progressPct > 80 ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {!project.isOnTime ? 'Atrasado' :
                     project.progressPct > 80 ? 'No prazo' :
                     'Em andamento'}
                  </span>
                </div>
              </div>
            ))}
          {projectMetrics.filter(p => p.status === 'active').length === 0 && (
            <div className="text-sm text-gray-500">Nenhum projeto ativo no momento.</div>
          )}
        </div>
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
        <h3 className="font-medium mb-2">Utilização por pessoa</h3>
        <div className="space-y-3">
          {collaborators.map((c) => {
            // Calcular alocação total e projetos simultâneos
            const { projectAllocations } = useAppStore.getState();
            const now = new Date();
            
            const activeAllocations = projectAllocations.filter(a => {
              if (a.collaboratorId !== c.id) return false;
              const endOk = new Date(a.endDate) > now;
              const startOk = new Date(a.startDate) <= now;
              const project = projects.find(p => p.id === a.projectId);
              const projectOk = !!project && project.status !== 'archived' && project.status !== 'cancelled';
              return endOk && startOk && projectOk;
            });
            
            const totalAllocation = activeAllocations.reduce((sum, a) => sum + a.percentage, 0);
            const simultaneousProjects = activeAllocations.length;
            
            // Calcular carga de horas (assumindo 40h/semana como 100%)
            const weeklyHours = Math.round((totalAllocation / 100) * 40);
            
            return (
              <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    <div className="text-xs text-gray-600">{c.position || c.role}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{totalAllocation}%</div>
                    <div className="text-xs text-gray-600">{weeklyHours}h/semana</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">
                    {simultaneousProjects} projeto{simultaneousProjects !== 1 ? 's' : ''} simultâneo{simultaneousProjects !== 1 ? 's' : ''}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    totalAllocation > 100 ? 'bg-red-100 text-red-800' :
                    totalAllocation > 80 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {totalAllocation > 100 ? 'Sobrealocado' :
                     totalAllocation > 80 ? 'Alta utilização' :
                     'Disponível'}
                  </span>
                </div>
                
                <div className="h-2 bg-gray-200 rounded-xl">
                  <div 
                    className={`h-2 rounded-xl ${
                      totalAllocation > 100 ? 'bg-red-500' :
                      totalAllocation > 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} 
                    style={{ width: `${Math.min(100, totalAllocation)}%` }} 
                  />
                </div>
                
                {activeAllocations.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {activeAllocations.map(allocation => {
                      const project = projects.find(p => p.id === allocation.projectId);
                      if (!project || project.status === 'archived' || project.status === 'cancelled') return null;
                      return (
                        <div key={allocation.id} className="flex justify-between text-xs text-gray-600">
                          <span>{project.name}</span>
                          <span>{allocation.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
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