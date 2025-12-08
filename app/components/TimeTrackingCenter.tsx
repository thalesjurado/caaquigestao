'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store-supabase';
import { useTimeTracking, TimeEntry, TimeTrackingProvider } from '@/lib/time-tracking';
import { showToast } from '@/lib/toast';

export default function TimeTrackingCenter() {
  const [activeTab, setActiveTab] = useState<'timer' | 'entries' | 'reports' | 'settings'>('timer');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>('');
  const [timerDescription, setTimerDescription] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  const { projects, collaborators, projectAllocations } = useAppStore();
  const { 
    entries, 
    providers, 
    activeTimer,
    startTimer,
    stopTimer,
    addEntry,
    updateEntry,
    deleteEntry,
    getStats,
    getProjectTimeReport,
    updateProvider,
    syncWithProvider,
    formatDuration
  } = useTimeTracking();

  // Atualizar timer a cada segundo
  const [timerDuration, setTimerDuration] = useState(0);
  useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - activeTimer.startTime.getTime()) / 60000);
        setTimerDuration(duration);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTimer]);

  const handleStartTimer = () => {
    if (!selectedProject || !selectedCollaborator || !timerDescription.trim()) {
      showToast('Preencha todos os campos para iniciar o timer', 'error');
      return;
    }

    startTimer(selectedProject, selectedCollaborator, timerDescription);
    showToast('Timer iniciado!', 'success');
  };

  const handleStopTimer = () => {
    const entry = stopTimer();
    if (entry) {
      showToast(`Timer parado! ${formatDuration(entry.duration)} registrado`, 'success');
      setTimerDescription('');
    }
  };

  const handleAddManualEntry = () => {
    if (!selectedProject || !selectedCollaborator) {
      showToast('Selecione projeto e colaborador', 'error');
      return;
    }

    const entry = {
      projectId: selectedProject,
      collaboratorId: selectedCollaborator,
      description: timerDescription || 'Entrada manual',
      startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hora atrás
      endTime: new Date(),
      duration: 60, // 1 hora
      billable: true,
      tags: ['manual'],
      source: 'manual' as const
    };

    addEntry(entry);
    showToast('Entrada adicionada!', 'success');
    setTimerDescription('');
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
  };

  const handleSaveEdit = () => {
    if (editingEntry) {
      updateEntry(editingEntry.id, editingEntry);
      setEditingEntry(null);
      showToast('Entrada atualizada!', 'success');
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta entrada?')) {
      deleteEntry(id);
      showToast('Entrada excluída!', 'success');
    }
  };

  const handleSyncProvider = async (providerId: string) => {
    try {
      await syncWithProvider(providerId);
      showToast('Sincronização concluída!', 'success');
    } catch (error) {
      showToast('Erro na sincronização', 'error');
    }
  };

  const stats = getStats(
    { start: new Date(dateRange.start), end: new Date(dateRange.end) }
  );

  const filteredEntries = entries.filter(e => {
    const entryDate = e.startTime.toISOString().split('T')[0];
    return entryDate >= dateRange.start && entryDate <= dateRange.end;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Time Tracking</h2>
        <div className="text-sm text-gray-500">
          {entries.length} entrada(s) registrada(s)
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('timer')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'timer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⏱️ Timer
          </button>
          <button
            onClick={() => setActiveTab('entries')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'entries'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📝 Entradas
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Relatórios
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⚙️ Configurações
          </button>
        </nav>
      </div>

      {/* Timer Tab */}
      {activeTab === 'timer' && (
        <div className="space-y-6">
          {/* Timer Ativo */}
          {activeTimer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">Timer Ativo</h3>
                <div className="text-2xl font-mono font-bold text-blue-600">
                  {formatDuration(timerDuration)}
                </div>
              </div>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>Projeto:</strong> {projects.find(p => p.id === activeTimer.projectId)?.name || activeTimer.projectId}</p>
                <p><strong>Colaborador:</strong> {collaborators.find(c => c.id === activeTimer.collaboratorId)?.name || activeTimer.collaboratorId}</p>
                <p><strong>Descrição:</strong> {activeTimer.description}</p>
                <p><strong>Iniciado em:</strong> {activeTimer.startTime.toLocaleString('pt-BR')}</p>
              </div>
              <button
                onClick={handleStopTimer}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                ⏹️ Parar Timer
              </button>
            </div>
          )}

          {/* Controles do Timer */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {activeTimer ? 'Novo Timer' : 'Iniciar Timer'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projeto
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um projeto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.client}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colaborador
                </label>
                <select
                  value={selectedCollaborator}
                  onChange={(e) => setSelectedCollaborator(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um colaborador</option>
                  {collaborators.map((collaborator) => (
                    <option key={collaborator.id} value={collaborator.id}>
                      {collaborator.name} - {collaborator.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição da Atividade
              </label>
              <input
                type="text"
                value={timerDescription}
                onChange={(e) => setTimerDescription(e.target.value)}
                placeholder="Ex: Desenvolvimento de feature, Reunião com cliente..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleStartTimer}
                disabled={!!activeTimer}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                ▶️ Iniciar Timer
              </button>
              <button
                onClick={handleAddManualEntry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                ➕ Adicionar Entrada Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries Tab */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="bg-white border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Lista de Entradas */}
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">⏱️</div>
                <p>Nenhuma entrada encontrada no período</p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold">{entry.description}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.billable 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.billable ? 'Faturável' : 'Não Faturável'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.source === 'manual' ? 'bg-blue-100 text-blue-800' :
                          entry.source === 'toggl' ? 'bg-red-100 text-red-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {entry.source}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Projeto:</span>
                          <div>{projects.find(p => p.id === entry.projectId)?.name || entry.projectId}</div>
                        </div>
                        <div>
                          <span className="font-medium">Colaborador:</span>
                          <div>{collaborators.find(c => c.id === entry.collaboratorId)?.name || entry.collaboratorId}</div>
                        </div>
                        <div>
                          <span className="font-medium">Duração:</span>
                          <div className="font-mono">{formatDuration(entry.duration)}</div>
                        </div>
                        <div>
                          <span className="font-medium">Data:</span>
                          <div>{entry.startTime.toLocaleDateString('pt-BR')}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(stats.totalHours * 100) / 100}h
              </div>
              <div className="text-sm text-gray-500">Total de Horas</div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(stats.billableHours * 100) / 100}h
              </div>
              <div className="text-sm text-gray-500">Horas Faturáveis</div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(stats.totalCost)}
              </div>
              <div className="text-sm text-gray-500">Custo Total</div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.entriesCount}
              </div>
              <div className="text-sm text-gray-500">Entradas</div>
            </div>
          </div>

          {/* Top Projetos */}
          {stats.topProjects.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Top Projetos</h3>
              <div className="space-y-3">
                {stats.topProjects.map((project, index) => (
                  <div key={project.projectId} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="font-medium">{project.projectName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{project.hours}h</div>
                      <div className="text-sm text-gray-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.cost)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Colaboradores */}
          {stats.topCollaborators.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Top Colaboradores</h3>
              <div className="space-y-3">
                {stats.topCollaborators.map((collaborator, index) => (
                  <div key={collaborator.collaboratorId} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="font-medium">{collaborator.collaboratorName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{collaborator.hours}h</div>
                      <div className="text-sm text-gray-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(collaborator.cost)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Integrações</h3>
          
          <div className="space-y-4">
            {providers.map((provider) => (
              <div key={provider.id} className="bg-white border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{provider.name}</h4>
                    <p className="text-gray-600 text-sm">
                      {provider.id === 'manual' ? 'Entradas manuais do sistema' :
                       provider.id === 'toggl' ? 'Integração com Toggl Track' :
                       provider.id === 'clockify' ? 'Integração com Clockify' :
                       'Integração com Harvest'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      provider.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {provider.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                    {provider.id !== 'manual' && (
                      <button
                        onClick={() => updateProvider(provider.id, { enabled: !provider.enabled })}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          provider.enabled
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {provider.enabled ? 'Desabilitar' : 'Habilitar'}
                      </button>
                    )}
                  </div>
                </div>

                {provider.enabled && provider.id !== 'manual' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={provider.apiKey || ''}
                          onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                          placeholder="Insira sua API key"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Workspace ID
                        </label>
                        <input
                          type="text"
                          value={provider.workspaceId || ''}
                          onChange={(e) => updateProvider(provider.id, { workspaceId: e.target.value })}
                          placeholder="ID do workspace"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {provider.lastSync ? (
                          <>Última sincronização: {provider.lastSync.toLocaleString('pt-BR')}</>
                        ) : (
                          'Nunca sincronizado'
                        )}
                      </div>
                      <button
                        onClick={() => handleSyncProvider(provider.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        🔄 Sincronizar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Entrada</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={editingEntry.description}
                  onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duração (minutos)
                </label>
                <input
                  type="number"
                  value={editingEntry.duration}
                  onChange={(e) => setEditingEntry({ ...editingEntry, duration: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="billable"
                  checked={editingEntry.billable}
                  onChange={(e) => setEditingEntry({ ...editingEntry, billable: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="billable" className="text-sm font-medium text-gray-700">
                  Faturável
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
