'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store-supabase';
import { toast } from '../../lib/toast';
import { hasPermission } from '../../lib/permissions';
import { ProjectAllocation } from '../../lib/types';

interface ProjectAllocationModalProps {
  projectId: string;
  onClose: () => void;
}

export default function ProjectAllocationModal({ projectId, onClose }: ProjectAllocationModalProps) {
  const { 
    collaborators, 
    projectAllocations, 
    projects,
    addProjectAllocation,
    updateProjectAllocation,
    deleteProjectAllocation 
  } = useAppStore();

  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('');
  const [percentage, setPercentage] = useState(50);
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const project = projects.find(p => p.id === projectId);
  const currentAllocations = projectAllocations.filter(a => a.projectId === projectId);

  // Configurar datas padrão baseadas no projeto
  useEffect(() => {
    if (project && !startDate && !endDate) {
      setStartDate(project.startDate.toISOString().split('T')[0]);
      setEndDate(project.endDate.toISOString().split('T')[0]);
    }
  }, [project, startDate, endDate]);

  // Auto-preencher cargo quando colaborador é selecionado
  useEffect(() => {
    if (selectedCollaboratorId) {
      const collaborator = collaborators.find(c => c.id === selectedCollaboratorId);
      if (collaborator && !role) {
        setRole(collaborator.position || collaborator.role);
      }
    }
  }, [selectedCollaboratorId, collaborators, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCollaboratorId || !role || !startDate || !endDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const allocation = {
      projectId,
      collaboratorId: selectedCollaboratorId,
      percentage,
      role,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    try {
      if (editingId) {
        await updateProjectAllocation(editingId, allocation);
        toast.success('Alocação atualizada com sucesso');
      } else {
        await addProjectAllocation(allocation);
        toast.success('Alocação adicionada com sucesso');
      }
      
      // Reset form
      setSelectedCollaboratorId('');
      setPercentage(50);
      setRole('');
      setEditingId(null);
    } catch (error) {
      toast.error('Erro ao salvar alocação');
    }
  };

  const startEdit = (allocation: ProjectAllocation) => {
    setEditingId(allocation.id);
    setSelectedCollaboratorId(allocation.collaboratorId);
    setPercentage(allocation.percentage);
    setRole(allocation.role);
    setStartDate(allocation.startDate.toISOString().split('T')[0]);
    setEndDate(allocation.endDate.toISOString().split('T')[0]);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta alocação?')) {
      try {
        await deleteProjectAllocation(id);
        toast.success('Alocação removida com sucesso');
      } catch (error) {
        toast.error('Erro ao remover alocação');
      }
    }
  };

  const calculateCost = (collaboratorId: string, percentage: number, startDate: Date, endDate: Date) => {
    const collaborator = collaborators.find(c => c.id === collaboratorId);
    if (!collaborator?.hourlyRate) return 0;

    const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const hoursPerWeek = (percentage / 100) * 40;
    const totalHours = hoursPerWeek * weeks;
    
    return totalHours * collaborator.hourlyRate;
  };

  const selectedCollaborator = collaborators.find(c => c.id === selectedCollaboratorId);
  const estimatedCost = selectedCollaborator && startDate && endDate ? 
    calculateCost(selectedCollaboratorId, percentage, new Date(startDate), new Date(endDate)) : 0;

  // Verificar permissões para ver custos
  const canViewCosts = selectedCollaborator?.accessLevel === 'management' || selectedCollaborator?.accessLevel === 'executive';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Alocação de Equipe - {project?.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Formulário de Alocação */}
          <div>
            <h3 className="font-medium mb-4">
              {editingId ? 'Editar Alocação' : 'Nova Alocação'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Colaborador *
                </label>
                <select
                  value={selectedCollaboratorId}
                  onChange={(e) => setSelectedCollaboratorId(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  required
                >
                  <option value="">Selecione um colaborador</option>
                  {collaborators.map(collaborator => (
                    <option key={collaborator.id} value={collaborator.id}>
                      {collaborator.name} - {collaborator.position || collaborator.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Alocação (%) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={percentage}
                    onChange={(e) => setPercentage(Number(e.target.value))}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Função no Projeto *
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border rounded-lg p-2"
                    placeholder="Ex: Tech Lead, Designer"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Data Início *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Data Fim *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              {/* Informações de Custo */}
              {canViewCosts && selectedCollaborator?.hourlyRate && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-medium text-blue-800 mb-2">Estimativa de Custo</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>Valor/hora: R$ {selectedCollaborator.hourlyRate.toFixed(2)}</div>
                    <div>Horas/semana: {((percentage / 100) * 40).toFixed(1)}h</div>
                    <div className="font-medium">
                      Custo estimado: R$ {estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600"
                >
                  {editingId ? 'Atualizar' : 'Adicionar'} Alocação
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setSelectedCollaboratorId('');
                      setPercentage(50);
                      setRole('');
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lista de Alocações Atuais */}
          <div>
            <h3 className="font-medium mb-4">Alocações Atuais</h3>
            
            <div className="space-y-3">
              {currentAllocations.map(allocation => {
                const collaborator = collaborators.find(c => c.id === allocation.collaboratorId);
                const cost = calculateCost(
                  allocation.collaboratorId, 
                  allocation.percentage, 
                  allocation.startDate, 
                  allocation.endDate
                );
                
                return (
                  <div key={allocation.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{collaborator?.name}</div>
                        <div className="text-sm text-gray-600">
                          {allocation.role} • {allocation.percentage}%
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(allocation)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(allocation.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {allocation.startDate.toLocaleDateString()} - {allocation.endDate.toLocaleDateString()}
                    </div>
                    
                    {canViewCosts && (
                      <div className="text-xs text-green-600 mt-1">
                        Custo: R$ {cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {currentAllocations.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  Nenhuma alocação ainda
                </div>
              )}
            </div>

            {/* Resumo Total */}
            {currentAllocations.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium">Resumo do Projeto</div>
                <div className="text-sm text-gray-600 mt-1">
                  Total de pessoas: {currentAllocations.length}
                </div>
                {canViewCosts && (
                  <div className="text-sm text-gray-600">
                    Custo total: R$ {currentAllocations.reduce((sum, allocation) => 
                      sum + calculateCost(allocation.collaboratorId, allocation.percentage, allocation.startDate, allocation.endDate)
                    , 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
