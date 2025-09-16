'use client';

import { useMemo } from 'react';
import type { ProjectAllocation, Collaborator, Project } from '../../lib/types';

interface TimelineViewProps {
  period: 'next30' | 'next60' | 'next365';
  collaborators: Collaborator[];
  projects: Project[];
  projectAllocations: ProjectAllocation[];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short'
  });
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric'
  });
}

export default function TimelineView({ period, collaborators, projects, projectAllocations }: TimelineViewProps) {
  const timelineData = useMemo(() => {
    const now = new Date();
    const endDate = period === 'next30' 
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      : period === 'next60'
      ? new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    // Gerar períodos (semanas para 30 dias, meses para 60 dias, meses para ano)
    const periods: Array<{
      id: number;
      start: Date;
      end: Date;
      label: string;
    }> = [];
    const isWeekly = period === 'next30';
    const isYearly = period === 'next365';
    const increment = isWeekly ? 7 : isYearly ? 30 : 30; // 7 dias, 30 dias (mês), ou 30 dias
    const totalPeriods = isWeekly ? 5 : isYearly ? 12 : 2; // 5 semanas, 12 meses, ou 2 meses

    for (let i = 0; i < totalPeriods; i++) {
      const periodStart = new Date(now.getTime() + (i * increment * 24 * 60 * 60 * 1000));
      const periodEnd = new Date(periodStart.getTime() + (increment * 24 * 60 * 60 * 1000));
      
      periods.push({
        id: i,
        start: periodStart,
        end: periodEnd,
        label: isWeekly 
          ? `Sem ${i + 1} (${formatDate(periodStart)})`
          : isYearly
          ? new Date(periodStart.getFullYear(), periodStart.getMonth()).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
          : formatMonth(periodStart)
      });
    }

    // Para cada colaborador, calcular alocação por período
    const timelineByPerson = collaborators.map(collaborator => {
      const personAllocations = projectAllocations.filter(a => a.collaboratorId === collaborator.id);
      
      const periodAllocations = periods.map(period => {
        // Encontrar projetos ativos neste período
        const activeProjects = personAllocations.filter(allocation => {
          const allocStart = new Date(allocation.startDate);
          const allocEnd = new Date(allocation.endDate);
          
          // Projeto está ativo se há sobreposição com o período
          return allocStart <= period.end && allocEnd >= period.start;
        });

        const totalAllocation = activeProjects.reduce((sum, alloc) => sum + alloc.percentage, 0);
        
        const projectDetails = activeProjects.map(allocation => {
          const project = projects.find(p => p.id === allocation.projectId);
          return {
            projectId: allocation.projectId,
            projectName: project?.name || 'Projeto não encontrado',
            allocation: allocation.percentage,
            client: project?.client || 'Cliente não encontrado'
          };
        });

        return {
          periodId: period.id,
          totalAllocation,
          projects: projectDetails,
          availableAllocation: Math.max(0, 100 - totalAllocation)
        };
      });

      return {
        collaboratorId: collaborator.id,
        name: collaborator.name,
        role: collaborator.role,
        periods: periodAllocations
      };
    });

    return {
      periods,
      timeline: timelineByPerson
    };
  }, [period, collaborators, projects, projectAllocations]);

  const getAllocationColor = (percentage: number): string => {
    if (percentage <= 25) return 'bg-green-500';
    if (percentage <= 50) return 'bg-blue-500';
    if (percentage <= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (percentage: number): string => {
    if (percentage <= 25) return 'text-green-700';
    if (percentage <= 50) return 'text-blue-700';
    if (percentage <= 75) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">
          📅 Visualização Timeline - {period === 'next30' ? 'Próximas 5 Semanas' : period === 'next365' ? 'Próximos 12 Meses' : 'Próximos 2 Meses'}
        </h3>
        <p className="text-sm text-blue-600">
          Alocação da equipe distribuída ao longo do tempo selecionado
        </p>
      </div>

      {/* Cabeçalho da Timeline */}
      <div className="overflow-x-auto">
        <div className={period === 'next365' ? 'min-w-[1400px]' : 'min-w-full'}>
          <div className="space-y-4">
            {/* Cabeçalho dos períodos */}
            <div className="flex gap-2 mb-4">
              <div className="w-32 font-semibold text-gray-700 flex-shrink-0">Colaborador</div>
              {timelineData.periods.map(periodItem => (
                <div key={periodItem.id} className={`text-center font-medium text-gray-700 text-xs ${period === 'next365' ? 'w-20 flex-shrink-0' : 'flex-1'}`}>
                  {periodItem.label}
                </div>
              ))}
            </div>

            {/* Linhas por colaborador */}
            {timelineData.timeline.map(person => (
              <div key={person.collaboratorId} className="flex gap-2 items-center py-3 border-b border-gray-100">
                {/* Nome do colaborador */}
                <div className="w-32 flex-shrink-0">
                  <div className="font-medium">{person.name}</div>
                  <div className="text-sm text-gray-600">{person.role}</div>
                </div>

                {/* Períodos de alocação */}
                {person.periods.map(periodData => (
                  <div key={periodData.periodId} className={`text-center ${period === 'next365' ? 'w-20 flex-shrink-0' : 'flex-1'}`}>
                    <div className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${getAllocationColor(periodData.totalAllocation)} text-white ${period === 'next365' ? 'w-16' : 'min-w-16'}`}>
                      {periodData.totalAllocation}%
                    </div>
                    
                    {/* Detalhes dos projetos no período - apenas para visões menores */}
                    {period !== 'next365' && periodData.projects.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {periodData.projects.map(project => (
                          <div key={project.projectId} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                            <div className="font-medium truncate">{project.projectName}</div>
                            <div>{project.allocation}%</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {period !== 'next365' && periodData.projects.length === 0 && (
                      <div className="mt-2 text-xs text-gray-400">
                        Disponível
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumo por período */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold mb-3">📊 Resumo por Período</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {timelineData.periods.map(period => {
            const periodStats = timelineData.timeline.reduce((acc, person) => {
              const periodData = person.periods.find(p => p.periodId === period.id);
              if (periodData) {
                acc.totalAllocation += periodData.totalAllocation;
                acc.peopleCount += 1;
                if (periodData.totalAllocation >= 90) acc.fullyAllocated += 1;
                if (periodData.availableAllocation >= 25) acc.available += 1;
              }
              return acc;
            }, { totalAllocation: 0, peopleCount: 0, fullyAllocated: 0, available: 0 });

            const avgUtilization = periodStats.peopleCount > 0 
              ? Math.round(periodStats.totalAllocation / periodStats.peopleCount) 
              : 0;

            return (
              <div key={period.id} className="bg-white rounded-lg p-3 border">
                <div className="text-sm font-medium text-gray-700 mb-2">{period.label}</div>
                <div className="space-y-1 text-xs">
                  <div className={`font-semibold ${getTextColor(avgUtilization)}`}>
                    {avgUtilization}% utilização média
                  </div>
                  <div className="text-gray-600">
                    {periodStats.available} disponíveis
                  </div>
                  <div className="text-gray-600">
                    {periodStats.fullyAllocated} totalmente alocados
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
