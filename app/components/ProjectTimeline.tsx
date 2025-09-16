'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '../../lib/store-supabase';
import type { Project } from '../../lib/types';

// interface TimelineItem {
//   id: string;
//   name: string;
//   client: string;
//   type: Project['type'];
//   status: Project['status'];
//   startDate: Date;
//   endDate: Date;
//   progress: number;
//   teamSize: number;
//   isOverdue: boolean;
// }

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short' 
  });
}

function getStatusColor(status: Project['status']): string {
  switch (status) {
    case 'planning': return 'bg-gray-500';
    case 'active': return 'bg-blue-500';
    case 'on_hold': return 'bg-yellow-500';
    case 'completed': return 'bg-green-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function getTypeColor(type: Project['type']): string {
  return type === 'tech_implementation' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
}

export default function ProjectTimeline() {
  const { projects, boardActivities, projectAllocations } = useAppStore();
  const [viewMode, setViewMode] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [selectedStatus, setSelectedStatus] = useState<'all' | Project['status']>('all');

  // Preparar dados da timeline
  const timelineData = useMemo(() => {
    const now = new Date();
    
    return projects
      .filter(project => selectedStatus === 'all' || project.status === selectedStatus)
      .map(project => {
        // Calcular progresso baseado em tarefas
        const projectTasks = boardActivities.filter(a => a.projectId === project.id);
        const completedTasks = projectTasks.filter(a => a.status === 'done').length;
        const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
        
        // Calcular tamanho da equipe
        const teamSize = projectAllocations.filter(a => a.projectId === project.id).length;
        
        // Verificar se está atrasado
        const isOverdue = project.endDate < now && project.status !== 'completed';

        return {
          id: project.id,
          name: project.name,
          client: project.client,
          type: project.type,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
          progress: Math.round(progress),
          teamSize,
          isOverdue
        };
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [projects, boardActivities, projectAllocations, selectedStatus]);

  // Calcular período de visualização
  const timeRange = useMemo(() => {
    if (timelineData.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        end: new Date(now.getFullYear(), now.getMonth() + 9, 0)
      };
    }

    const allDates = timelineData.flatMap(item => [item.startDate, item.endDate]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Adicionar margem
    const margin = viewMode === 'month' ? 30 : viewMode === 'quarter' ? 90 : 365;
    return {
      start: new Date(minDate.getTime() - margin * 24 * 60 * 60 * 1000),
      end: new Date(maxDate.getTime() + margin * 24 * 60 * 60 * 1000)
    };
  }, [timelineData, viewMode]);

  // Gerar marcadores de tempo
  const timeMarkers = useMemo(() => {
    const markers = [];
    const current = new Date(timeRange.start);
    
    while (current <= timeRange.end) {
      markers.push(new Date(current));
      
      if (viewMode === 'month') {
        current.setMonth(current.getMonth() + 1);
      } else if (viewMode === 'quarter') {
        current.setMonth(current.getMonth() + 3);
      } else {
        current.setFullYear(current.getFullYear() + 1);
      }
    }
    
    return markers;
  }, [timeRange, viewMode]);

  // Calcular posição na timeline
  const getPosition = (date: Date) => {
    const totalDuration = timeRange.end.getTime() - timeRange.start.getTime();
    const elapsed = date.getTime() - timeRange.start.getTime();
    return (elapsed / totalDuration) * 100;
  };

  const getWidth = (startDate: Date, endDate: Date) => {
    const startPos = getPosition(startDate);
    const endPos = getPosition(endDate);
    return endPos - startPos;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Timeline de Projetos</h1>
          <p className="text-sm text-gray-600">
            Visualização temporal dos projetos e seus cronogramas
          </p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">Todos os Status</option>
            <option value="planning">Planejamento</option>
            <option value="active">Ativo</option>
            <option value="on_hold">Em Pausa</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
          
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="month">Visão Mensal</option>
            <option value="quarter">Visão Trimestral</option>
            <option value="year">Visão Anual</option>
          </select>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-600">
            {timelineData.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-blue-600">Projetos Ativos</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-600">
            {timelineData.filter(p => p.isOverdue).length}
          </div>
          <div className="text-sm text-red-600">Projetos Atrasados</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600">
            {timelineData.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-sm text-green-600">Projetos Concluídos</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(timelineData.reduce((sum, p) => sum + p.progress, 0) / Math.max(timelineData.length, 1))}%
          </div>
          <div className="text-sm text-purple-600">Progresso Médio</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border rounded-xl p-6">
        {/* Cabeçalho da timeline */}
        <div className="relative mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            {timeMarkers.map((marker, index) => (
              <div key={index} className="text-center">
                {viewMode === 'year' 
                  ? marker.getFullYear()
                  : marker.toLocaleDateString('pt-BR', { 
                      month: 'short', 
                      year: viewMode === 'month' ? '2-digit' : 'numeric' 
                    })
                }
              </div>
            ))}
          </div>
          
          {/* Linha de hoje */}
          <div className="relative h-2 bg-gray-100 rounded">
            <div 
              className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
              style={{ left: `${getPosition(new Date())}%` }}
            />
            <div 
              className="absolute -top-1 text-xs text-red-600 font-medium"
              style={{ left: `${getPosition(new Date())}%`, transform: 'translateX(-50%)' }}
            >
              Hoje
            </div>
          </div>
        </div>

        {/* Projetos */}
        <div className="space-y-4">
          {timelineData.map((project) => (
            <div key={project.id} className="relative">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-48 flex-shrink-0">
                  <div className="font-medium text-sm">{project.name}</div>
                  <div className="text-xs text-gray-600">{project.client}</div>
                  <div className="flex gap-1 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(project.type)}`}>
                      {project.type === 'tech_implementation' ? 'Tech' : 'Growth'}
                    </span>
                    {project.teamSize > 0 && (
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        {project.teamSize} pessoas
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 relative h-8">
                  {/* Barra do projeto */}
                  <div
                    className={`absolute h-6 rounded-lg ${getStatusColor(project.status)} ${
                      project.isOverdue ? 'ring-2 ring-red-500' : ''
                    }`}
                    style={{
                      left: `${getPosition(project.startDate)}%`,
                      width: `${getWidth(project.startDate, project.endDate)}%`,
                      minWidth: '2px'
                    }}
                  />
                  
                  {/* Barra de progresso */}
                  {project.progress > 0 && (
                    <div
                      className="absolute h-6 rounded-lg bg-white bg-opacity-30"
                      style={{
                        left: `${getPosition(project.startDate)}%`,
                        width: `${getWidth(project.startDate, project.endDate) * (project.progress / 100)}%`,
                        minWidth: '1px'
                      }}
                    />
                  )}
                  
                  {/* Labels de data */}
                  <div
                    className="absolute -bottom-5 text-xs text-gray-600"
                    style={{ left: `${getPosition(project.startDate)}%` }}
                  >
                    {formatDate(project.startDate)}
                  </div>
                  <div
                    className="absolute -bottom-5 text-xs text-gray-600"
                    style={{ 
                      left: `${getPosition(project.endDate)}%`,
                      transform: 'translateX(-100%)'
                    }}
                  >
                    {formatDate(project.endDate)}
                  </div>
                </div>
                
                <div className="w-16 text-right text-sm">
                  <div className="font-medium">{project.progress}%</div>
                  {project.isOverdue && (
                    <div className="text-xs text-red-600">Atrasado</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {timelineData.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum projeto encontrado para os filtros selecionados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-medium mb-3">Legenda:</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span>Planejamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Em Pausa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Cancelado</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-600">
          • A linha vermelha indica &quot;hoje&quot; • Projetos com borda vermelha estão atrasados • A área clara mostra o progresso
        </div>
      </div>
    </div>
  );
}
