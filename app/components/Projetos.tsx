'use client';

import { useMemo } from 'react';
import { useAppStore } from '../../lib/store-supabase';

export default function Projetos() {
  const boardActivities = useAppStore(s => s.boardActivities);
  const collaborators = useAppStore(s => s.collaborators);

  const projectsByClient = useMemo(() => {
    const projects = new Map<string, typeof boardActivities>();
    
    boardActivities.forEach(activity => {
      const clientName = activity.client?.trim() || 'Sem Cliente';
      if (!projects.has(clientName)) {
        projects.set(clientName, []);
      }
      projects.get(clientName)!.push(activity);
    });

    // Ordenar por cliente
    return Array.from(projects.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([client, tasks]) => ({
        client,
        tasks: tasks.sort((a, b) => {
          const statusOrder: Record<string, number> = { 'backlog': -1, 'todo': 0, 'doing': 1, 'done': 2, 'historical': 3 };
          return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        })
      }));
  }, [boardActivities]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-700';
      case 'doing': return 'bg-blue-100 text-blue-700';
      case 'done': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'A Fazer';
      case 'doing': return 'Em Progresso';
      case 'done': return 'Concluído';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Projetos por Cliente</h1>
          <p className="text-sm text-gray-600">
            Visão organizada das tarefas agrupadas por cliente
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {projectsByClient.length} cliente{projectsByClient.length !== 1 ? 's' : ''}
        </div>
      </div>

      {projectsByClient.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhuma tarefa com cliente definido ainda.</p>
          <p className="text-sm mt-1">Adicione tarefas no Board com clientes para vê-las aqui.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projectsByClient.map(({ client, tasks }) => {
            const todoCount = tasks.filter(t => t.status === 'todo').length;
            const doingCount = tasks.filter(t => t.status === 'doing').length;
            const doneCount = tasks.filter(t => t.status === 'done').length;
            const totalPoints = tasks.reduce((sum, t) => sum + (t.points || 0), 0);

            return (
              <div key={client} className="rounded-2xl border bg-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{client}</h2>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''}</span>
                      {totalPoints > 0 && <span>{totalPoints} pontos</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    {todoCount > 0 && (
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {todoCount} pendente{todoCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {doingCount > 0 && (
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {doingCount} em andamento
                      </span>
                    )}
                    {doneCount > 0 && (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {doneCount} concluída{doneCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {tasks.map(task => {
                    const assignee = collaborators.find(c => c.id === task.assigneeId);
                    
                    return (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {task.points && (
                            <span className="px-2 py-1 rounded-full bg-white border">
                              {task.points} pts
                            </span>
                          )}
                          {assignee && (
                            <span className="px-2 py-1 rounded-full bg-white border">
                              {assignee.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>{Math.round((doneCount / tasks.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(doneCount / tasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
