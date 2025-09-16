'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '../../lib/store-supabase';
import type { Project, ProjectAllocation, Collaborator } from '../../lib/types';
import TimelineView from './TimelineView';

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

function getAvailabilityColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-100 text-red-800';
  if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
  if (percentage >= 50) return 'bg-blue-100 text-blue-800';
  return 'bg-green-100 text-green-800';
}

function getAllocationColor(percentage: number): string {
  if (percentage <= 25) return 'bg-green-500';
  if (percentage <= 50) return 'bg-blue-500';
  if (percentage <= 75) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function TeamAvailability() {
  const { getTeamAvailability, getProjectMetrics, collaborators, projects, projectAllocations } = useAppStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'next30' | 'next60' | 'year'>('current');
  
  const teamAvailability = useMemo(() => getTeamAvailability(), [getTeamAvailability]);
  const projectMetrics = useMemo(() => getProjectMetrics(), [getProjectMetrics]);

  // Filtrar por período
  const filteredAvailability = useMemo(() => {
    const now = new Date();
    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const next60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    return teamAvailability.map(person => {
      let filteredProjects = person.projects;
      
      if (selectedPeriod === 'next30') {
        filteredProjects = person.projects.filter(p => {
          const endDate = new Date(p.endDate);
          return endDate >= now && endDate <= next30;
        });
      } else if (selectedPeriod === 'next60') {
        filteredProjects = person.projects.filter(p => {
          const endDate = new Date(p.endDate);
          return endDate >= now && endDate <= next60;
        });
      } else if (selectedPeriod === 'year') {
        filteredProjects = person.projects.filter(p => {
          const endDate = new Date(p.endDate);
          return endDate >= now && endDate <= nextYear;
        });
      }

      const totalAllocation = filteredProjects.reduce((sum, p) => sum + p.allocation, 0);
      
      return {
        ...person,
        projects: filteredProjects,
        totalAllocation,
        availableAllocation: Math.max(0, 100 - totalAllocation)
      };
    });
  }, [teamAvailability, selectedPeriod]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalPeople = collaborators.length;
    const fullyAllocated = filteredAvailability.filter(p => p.totalAllocation >= 90).length;
    const available = filteredAvailability.filter(p => p.availableAllocation >= 25).length;
    const activeProjects = projects.filter(p => p.status === 'active').length;

    return {
      totalPeople,
      fullyAllocated,
      available,
      activeProjects,
      utilizationRate: totalPeople > 0 ? Math.round(
        (filteredAvailability.reduce((sum, p) => sum + p.totalAllocation, 0) / (totalPeople * 100)) * 100
      ) : 0
    };
  }, [filteredAvailability, collaborators.length, projects]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Disponibilidade da Equipe</h1>
          <p className="text-sm text-gray-600">
            Dashboard para o time comercial visualizar alocação e disponibilidade
          </p>
        </div>
        
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as typeof selectedPeriod)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="current">Período Atual</option>
          <option value="next30">Próximos 30 dias</option>
          <option value="next60">Próximos 60 dias</option>
          <option value="year">Ano</option>
        </select>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.totalPeople}</div>
          <div className="text-sm text-blue-600">Total de Pessoas</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          <div className="text-sm text-green-600">Disponíveis (25%+)</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-600">{stats.fullyAllocated}</div>
          <div className="text-sm text-red-600">Totalmente Alocados</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.activeProjects}</div>
          <div className="text-sm text-purple-600">Projetos Ativos</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.utilizationRate}%</div>
          <div className="text-sm text-orange-600">Taxa de Utilização</div>
        </div>
      </div>

      {/* Timeline View para períodos de 30, 60 dias e ano */}
      {(selectedPeriod === 'next30' || selectedPeriod === 'next60' || selectedPeriod === 'year') && (
        <TimelineView 
          period={selectedPeriod === 'year' ? 'next365' : selectedPeriod}
          collaborators={collaborators}
          projects={projects}
          projectAllocations={projectAllocations}
        />
      )}

      {/* Lista de Disponibilidade por Pessoa - apenas para período atual */}
      {selectedPeriod === 'current' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Alocação por Pessoa</h2>
          
          {filteredAvailability.map(person => (
          <div key={person.collaboratorId} className="bg-white border rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{person.name}</h3>
                <p className="text-sm text-gray-600">{person.role}</p>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getAvailabilityColor(person.totalAllocation)}`}>
                  {person.totalAllocation}% alocado
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {person.availableAllocation}% disponível
                </div>
              </div>
            </div>

            {/* Barra de Alocação Visual */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Alocação Atual</span>
                <span>{person.totalAllocation}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getAllocationColor(person.totalAllocation)}`}
                  style={{ width: `${Math.min(person.totalAllocation, 100)}%` }}
                />
              </div>
            </div>

            {/* Projetos Atuais */}
            {person.projects.length > 0 ? (
              <div>
                <h4 className="font-medium mb-3">Projetos Atuais:</h4>
                <div className="space-y-2">
                  {person.projects.map(project => (
                    <div key={project.projectId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{project.projectName}</span>
                        <div className="text-sm text-gray-600">
                          Termina em: {formatDate(project.endDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{project.allocation}%</span>
                        <div className="text-xs text-gray-500">alocação</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                <p>Nenhum projeto ativo no período selecionado</p>
                <p className="text-sm">Disponível para novos projetos</p>
              </div>
            )}
          </div>
        ))}

        {filteredAvailability.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum colaborador cadastrado ainda.</p>
          </div>
        )}
        </div>
      )}

      {/* Resumo de Projetos */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Resumo de Projetos Ativos</h2>
        
        {projectMetrics.filter(p => p.status === 'active').length > 0 ? (
          <div className="grid gap-4">
            {projectMetrics
              .filter(p => p.status === 'active')
              .sort((a, b) => a.daysRemaining - b.daysRemaining)
              .map(project => (
                <div key={project.projectId} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-gray-600">{project.client} • {project.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-4 text-sm">
                      <span>
                        <strong>{project.teamSize}</strong> pessoas
                      </span>
                      <span>
                        <strong>{Math.round(project.progress)}%</strong> concluído
                      </span>
                      <span className={project.daysRemaining > 0 ? 'text-green-600' : 'text-red-600'}>
                        <strong>{Math.abs(project.daysRemaining)}</strong> dias {project.daysRemaining > 0 ? 'restantes' : 'em atraso'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum projeto ativo no momento</p>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-medium mb-3">Legenda de Cores:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>0-25% (Muito Disponível)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>26-50% (Disponível)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>51-75% (Ocupado)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>76-100% (Totalmente Alocado)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
