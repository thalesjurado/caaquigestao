'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store-supabase';
import { Project, ProjectAllocation } from '../../lib/types';
import { toast } from '../../lib/toast';

const PROJECT_TYPES = [
  { value: 'tech_implementation', label: 'Tech Implementation', color: 'bg-blue-100 text-blue-800' },
  { value: 'growth_agency', label: 'Growth/Agency', color: 'bg-green-100 text-green-800' }
] as const;

const PROJECT_STATUS = [
  { value: 'planning', label: 'Planejamento', color: 'bg-gray-100 text-gray-800' },
  { value: 'active', label: 'Ativo', color: 'bg-blue-100 text-blue-800' },
  { value: 'on_hold', label: 'Em Pausa', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
] as const;

interface TeamAllocation {
  collaboratorId: string;
  percentage: number;
  role?: string;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject?: Project | null;
  onSuccess?: () => void;
}

export default function ProjectModal({ isOpen, onClose, editingProject, onSuccess }: ProjectModalProps) {
  const { 
    addProject, 
    updateProject, 
    collaborators, 
    addProjectAllocation, 
    updateProjectAllocation, 
    deleteProjectAllocation,
    projectAllocations 
  } = useAppStore();
  
  // Campos do formulário
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    type: 'tech_implementation' as Project['type'],
    status: 'planning' as Project['status'],
    startDate: '',
    endDate: '',
    description: '',
    budget: '',
    // Tech details
    sdkType: '',
    cdpIntegration: '',
    martechTools: '',
    // Growth details
    crmPlatform: '',
    campaignType: '',
    expectedResults: ''
  });

  // Alocação de equipe
  const [teamAllocations, setTeamAllocations] = useState<TeamAllocation[]>([]);

  const resetForm = () => {
    setFormData({
      name: '',
      client: '',
      type: 'tech',
      status: 'planning',
      startDate: '',
      endDate: '',
      description: '',
      budget: '',
      sdkType: '',
      cdpIntegration: '',
      martechTools: '',
      crmPlatform: '',
      campaignType: '',
      expectedResults: ''
    });
    setTeamAllocations([]);
  };

  // Carregar dados do projeto para edição
  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name,
        client: editingProject.client,
        type: editingProject.type,
        status: editingProject.status,
        startDate: editingProject.startDate.toISOString().split('T')[0],
        endDate: editingProject.endDate.toISOString().split('T')[0],
        description: editingProject.description || '',
        budget: editingProject.budget?.toString() || '',
        sdkType: editingProject.techDetails?.platform || '',
        cdpIntegration: editingProject.techDetails?.cdpIntegration || '',
        martechTools: editingProject.techDetails?.martechTools?.join(', ') || '',
        crmPlatform: editingProject.growthDetails?.crmPlatform || '',
        campaignType: editingProject.growthDetails?.campaignType || '',
        expectedResults: editingProject.growthDetails?.expectedResults || ''
      });

      // Carregar alocações existentes
      const existingAllocations = projectAllocations
        .filter(a => a.projectId === editingProject.id)
        .map(a => ({
          collaboratorId: a.collaboratorId,
          percentage: a.percentage,
          role: a.role
        }));
      setTeamAllocations(existingAllocations);
    } else {
      resetForm();
    }
  }, [editingProject, projectAllocations]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addTeamMember = () => {
    setTeamAllocations([...teamAllocations, { collaboratorId: '', percentage: 0 }]);
  };

  const updateTeamMember = (index: number, field: keyof TeamAllocation, value: string | number) => {
    const updated = [...teamAllocations];
    updated[index] = { ...updated[index], [field]: value };
    setTeamAllocations(updated);
  };

  const removeTeamMember = (index: number) => {
    setTeamAllocations(teamAllocations.filter((_, i) => i !== index));
  };

  // Validar alocações
  const validateAllocations = () => {
    const collaboratorTotals = new Map<string, number>();
    
    teamAllocations.forEach(allocation => {
      if (allocation.collaboratorId && allocation.percentage > 0) {
        const current = collaboratorTotals.get(allocation.collaboratorId) || 0;
        collaboratorTotals.set(allocation.collaboratorId, current + allocation.percentage);
      }
    });

    // Verificar se algum colaborador excede 100%
    for (const [collaboratorId, total] of collaboratorTotals) {
      if (total > 100) {
        const collaborator = collaborators.find(c => c.id === collaboratorId);
        return `${collaborator?.name} tem ${total}% de alocação total, excedendo 100%`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.client || !formData.startDate || !formData.endDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const allocationError = validateAllocations();
    if (allocationError) {
      toast.error(allocationError);
      return;
    }

    const projectData: Omit<Project, 'id' | 'allocations'> = {
      name: formData.name,
      client: formData.client,
      type: formData.type,
      status: formData.status,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      description: formData.description || undefined,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      techDetails: formData.type === 'tech' ? {
        platform: formData.sdkType,
        cdpIntegration: formData.cdpIntegration,
        martechTools: formData.martechTools ? formData.martechTools.split(',').map(s => s.trim()) : undefined
      } : undefined,
      growthDetails: formData.type === 'growth' ? {
        crmPlatform: formData.crmPlatform || undefined,
        campaignType: formData.campaignType || undefined,
        expectedResults: formData.expectedResults || undefined
      } : undefined
    };

    try {
      let projectId: string;

      if (editingProject) {
        await updateProject(editingProject.id, projectData);
        projectId = editingProject.id;
        toast.success('Projeto atualizado com sucesso!');

        // Remover alocações antigas
        const oldAllocations = projectAllocations.filter(a => a.projectId === editingProject.id);
        for (const allocation of oldAllocations) {
          await deleteProjectAllocation(allocation.id);
        }
      } else {
        await addProject(projectData);
        // Para novos projetos, usar um ID temporário baseado no nome e timestamp
        projectId = `${formData.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
        toast.success('Projeto criado com sucesso!');
      }

      // Adicionar novas alocações
      for (const allocation of teamAllocations) {
        if (allocation.collaboratorId && allocation.percentage > 0) {
          await addProjectAllocation({
            projectId,
            collaboratorId: allocation.collaboratorId,
            percentage: allocation.percentage,
            role: allocation.role || '',
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate)
          });
        }
      }

      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Erro ao salvar projeto:', err);
      toast.error('Erro ao salvar projeto');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
        </h3>
        
        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome do projeto *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="border rounded-lg p-3"
            />
            <input
              type="text"
              placeholder="Cliente *"
              value={formData.client}
              onChange={(e) => setFormData({...formData, client: e.target.value})}
              className="border rounded-lg p-3"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as Project['type']})}
              className="border rounded-lg p-3"
            >
              {PROJECT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as Project['status']})}
              className="border rounded-lg p-3"
            >
              {PROJECT_STATUS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="date"
              placeholder="Data de início *"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="border rounded-lg p-3"
            />
            <input
              type="date"
              placeholder="Data de fim *"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="border rounded-lg p-3"
            />
          </div>

          <textarea
            placeholder="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full border rounded-lg p-3"
            rows={3}
          />

          <input
            type="number"
            placeholder="Orçamento (R$)"
            value={formData.budget}
            onChange={(e) => setFormData({...formData, budget: e.target.value})}
            className="w-full border rounded-lg p-3"
          />

          {/* Alocação de Equipe */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-700">Alocação de Equipe</h4>
              <button
                type="button"
                onClick={addTeamMember}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Adicionar membro
              </button>
            </div>
            
            <div className="space-y-3">
              {teamAllocations.map((allocation, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                  <select
                    value={allocation.collaboratorId}
                    onChange={(e) => updateTeamMember(index, 'collaboratorId', e.target.value)}
                    className="col-span-4 border rounded-lg p-2"
                  >
                    <option value="">Selecionar pessoa</option>
                    {collaborators.map(collaborator => (
                      <option key={collaborator.id} value={collaborator.id}>
                        {collaborator.name}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="% Esforço"
                    value={allocation.percentage}
                    onChange={(e) => updateTeamMember(index, 'percentage', parseInt(e.target.value) || 0)}
                    className="col-span-2 border rounded-lg p-2"
                  />
                  
                  <input
                    type="text"
                    placeholder="Função (opcional)"
                    value={allocation.role || ''}
                    onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                    className="col-span-5 border rounded-lg p-2"
                  />
                  
                  <button
                    type="button"
                    onClick={() => removeTeamMember(index)}
                    className="col-span-1 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {teamAllocations.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  Nenhum membro alocado ainda. Clique em "Adicionar membro" para começar.
                </div>
              )}
            </div>
          </div>

          {/* Campos específicos por tipo */}
          {formData.type === 'tech' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-gray-700">Detalhes Técnicos</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Plataforma"
                  value={formData.sdkType}
                  onChange={(e) => setFormData({...formData, sdkType: e.target.value})}
                  className="border rounded-lg p-3"
                />
                <input
                  type="text"
                  placeholder="Integração CDP"
                  value={formData.cdpIntegration}
                  onChange={(e) => setFormData({...formData, cdpIntegration: e.target.value})}
                  className="border rounded-lg p-3"
                />
              </div>
              <input
                type="text"
                placeholder="Ferramentas Martech (separadas por vírgula)"
                value={formData.martechTools}
                onChange={(e) => setFormData({...formData, martechTools: e.target.value})}
                className="w-full border rounded-lg p-3"
              />
            </div>
          )}

          {formData.type === 'growth' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-gray-700">Detalhes de Growth</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Plataforma CRM"
                  value={formData.crmPlatform}
                  onChange={(e) => setFormData({...formData, crmPlatform: e.target.value})}
                  className="border rounded-lg p-3"
                />
                <input
                  type="text"
                  placeholder="Tipo de Campanha"
                  value={formData.campaignType}
                  onChange={(e) => setFormData({...formData, campaignType: e.target.value})}
                  className="border rounded-lg p-3"
                />
              </div>
              <textarea
                placeholder="Resultados Esperados"
                value={formData.expectedResults}
                onChange={(e) => setFormData({...formData, expectedResults: e.target.value})}
                className="w-full border rounded-lg p-3"
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            {editingProject ? 'Atualizar' : 'Criar'} Projeto
          </button>
        </div>
      </div>
    </div>
  );
}
