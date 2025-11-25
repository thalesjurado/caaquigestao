'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '../../lib/store-supabase';
import ProjectAllocationModal from '../components/ProjectAllocationModal';

export default function POPage() {
  const { projects, projectAllocations, collaborators } = useAppStore((s) => ({
    projects: s.projects,
    projectAllocations: s.projectAllocations,
    collaborators: s.collaborators,
  }));

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const planningProjects = useMemo(() =>
    projects.filter((p) => p.status === 'planning'),
  [projects]);

  const allocationsByProject = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of projectAllocations) {
      map[a.projectId] = (map[a.projectId] || 0) + a.percentage;
    }
    return map;
  }, [projectAllocations]);

  const teamAvailability = useMemo(() => {
    // % de alocação por colaborador (somatório das alocações ativas)
    const now = new Date();
    const map: Record<string, number> = {};
    for (const a of projectAllocations) {
      if (a.startDate <= now && a.endDate >= now) {
        map[a.collaboratorId] = (map[a.collaboratorId] || 0) + a.percentage;
      }
    }
    return collaborators.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.position || c.role,
      total: Math.min(map[c.id] || 0, 100),
      available: Math.max(0, 100 - (map[c.id] || 0)),
    }));
  }, [projectAllocations, collaborators]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Painel do PO — Organização e Alocação</h1>
        <p className="text-sm text-gray-600">Defina equipes e horas semanais por projeto em planejamento.</p>
      </header>

      {/* Projetos em planejamento */}
      <section className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Projetos "Em Planejamento"</h2>
          <div className="text-xs text-gray-500">{planningProjects.length} projeto(s)</div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {planningProjects.map((p) => (
            <div key={p.id} className="border rounded-xl p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-600">{p.client}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {p.startDate.toLocaleDateString()} → {p.endDate.toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Alocação total</div>
                  <div className="text-sm font-medium">{allocationsByProject[p.id] || 0}%</div>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  className="px-3 py-2 rounded-xl bg-black text-white"
                  onClick={() => setSelectedProjectId(p.id)}
                >
                  Definir Alocação
                </button>
              </div>
            </div>
          ))}
          {planningProjects.length === 0 && (
            <div className="text-sm text-gray-500">Nenhum projeto em planejamento no momento.</div>
          )}
        </div>
      </section>

      {/* Capacidade atual da equipe */}
      <section className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Capacidade Atual da Operação</h2>
          <div className="text-xs text-gray-500">{teamAvailability.length} pessoas</div>
        </div>

        <div className="space-y-2">
          {teamAvailability.map((t) => (
            <div key={t.id} className="grid grid-cols-3 items-center gap-3">
              <div className="truncate">
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-gray-600">{t.role}</div>
              </div>
              <div className="text-xs text-gray-600">Alocado: {t.total}%</div>
              <div className="text-xs text-green-700">Disponível: {t.available}%</div>
            </div>
          ))}
          {teamAvailability.length === 0 && (
            <div className="text-sm text-gray-500">Sem colaboradores cadastrados.</div>
          )}
        </div>
      </section>

      {selectedProjectId && (
        <ProjectAllocationModal
          projectId={selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
        />
      )}
    </div>
  );
}
