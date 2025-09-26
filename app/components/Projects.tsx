'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '../../lib/store-supabase';
import { Project } from '../../lib/types';
import { toast } from '../../lib/toast';
import ProjectModal from './ProjectModal';

const typeColors = {
  'tech': { color: 'bg-blue-100 text-blue-800', label: 'Tech' },
  'growth': { color: 'bg-green-100 text-green-800', label: 'Growth' }
};

const PROJECT_TYPES = [
  { value: 'tech', label: 'Tech Implementation', color: typeColors['tech'].color },
  { value: 'growth', label: 'Growth/Agency', color: typeColors['growth'].color }
] as const;

const PROJECT_STATUS = [
  { value: 'planning', label: 'Planejamento', color: 'bg-gray-100 text-gray-800' },
  { value: 'active', label: 'Ativo', color: 'bg-blue-100 text-blue-800' },
  { value: 'on_hold', label: 'Em Pausa', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
] as const;

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export default function Projects() {
  const { projects, deleteProject } = useAppStore();
  
  // Estado do modal de projeto
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'upcoming'>('all');

  const openNewModal = () => {
    setEditingProject(null);
    setShowProjectModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const closeModal = () => {
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleDelete = async (project: Project) => {
    if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
      try {
        await deleteProject(project.id);
        toast.success('Projeto excluído com sucesso!');
      } catch (err) {
        toast.error('Erro ao excluir projeto');
      }
    }
  };

  // Função para determinar status do projeto baseado em datas
  const getProjectStatus = (project: Project) => {
    const now = new Date();
    const endDate = new Date(project.endDate);
    const startDate = new Date(project.startDate);
    const daysToEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Se o projeto ainda não começou
    if (now < startDate) return 'upcoming';
    
    // Se o projeto já terminou
    if (now > endDate) return 'completed';
    
    // Se está em andamento mas próximo do fim (menos de 7 dias)
    if (daysToEnd <= 7 && daysToEnd > 0) return 'ending_soon';
    
    // Se está atrasado (passou da data de fim e status não é completed)
    if (daysToEnd < 0 && project.status !== 'completed') return 'overdue';
    
    // Se está ativo
    return 'active';
  };

  // Filtrar projetos baseado no filtro selecionado
  const filteredProjects = useMemo(() => {
    if (statusFilter === 'all') return projects;
    
    return projects.filter(project => {
      const projectStatus = getProjectStatus(project);
      
      switch (statusFilter) {
        case 'active':
          return projectStatus === 'active' || projectStatus === 'ending_soon';
        case 'overdue':
          return projectStatus === 'overdue';
        case 'upcoming':
          return projectStatus === 'upcoming';
        default:
          return true;
      }
    });
  }, [projects, statusFilter]);

  // Agrupar projetos filtrados por cliente
  const projectsByClient = useMemo(() => {
    const groups = new Map<string, Project[]>();
    filteredProjects.forEach(project => {
      const client = project.client;
      if (!groups.has(client)) {
        groups.set(client, []);
      }
      groups.get(client)!.push(project);
    });
    return Array.from(groups.entries()).map(([client, projects]) => ({
      client,
      projects: projects.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    }));
  }, [filteredProjects]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Projetos</h1>
          <p className="text-sm text-gray-600">
            Gerencie projetos, aloque equipe e acompanhe cronogramas
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Filtros de Status */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'all' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'active' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              Ativos
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'overdue' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              Atrasados
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'upcoming' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              Futuros
            </button>
          </div>
          
          <button
            onClick={() => window.location.hash = '#timeline'}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 text-sm"
          >
            📅 Ver Timeline
          </button>
          <button
            onClick={() => window.location.hash = '#availability'}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 text-sm"
          >
            👥 Ver Disponibilidade
          </button>
          <button
            onClick={openNewModal}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            + Novo Projeto
          </button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-600">
            {projects.filter(p => p.type === 'tech').length}
          </div>
          <div className="text-sm text-blue-600">Tech Implementation</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600">
            {projects.filter(p => p.type === 'growth').length}
          </div>
          <div className="text-sm text-green-600">Growth/Agency</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-600">
            {projects.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-orange-600">Projetos Ativos</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-600">
            {projectsByClient.length}
          </div>
          <div className="text-sm text-purple-600">Clientes</div>
        </div>
      </div>

      {/* Lista de projetos agrupados por cliente */}
      <div className="space-y-6">
        {projectsByClient.map(({ client, projects: clientProjects }) => (
          <div key={client} className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">{client}</h3>
            <div className="grid gap-4">
              {clientProjects.map(project => {
                const typeInfo = PROJECT_TYPES.find(t => t.value === project.type);
                const statusInfo = PROJECT_STATUS.find(s => s.value === project.status);
                const daysRemaining = Math.ceil((project.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-gray-600">{project.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(project)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${typeInfo?.color}`}>
                        {typeInfo?.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${statusInfo?.color}`}>
                        {statusInfo?.label}
                      </span>
                      {project.budget && (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {formatCurrency(project.budget)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        {formatDate(project.startDate)} - {formatDate(project.endDate)}
                      </span>
                      <span className={
                        getProjectStatus(project) === 'overdue' ? 'text-red-600' :
                        getProjectStatus(project) === 'ending_soon' ? 'text-orange-600' :
                        getProjectStatus(project) === 'upcoming' ? 'text-blue-600' :
                        'text-green-600'
                      }>
                        {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 
                         daysRemaining === 0 ? 'Termina hoje' :
                         `${Math.abs(daysRemaining)} dias em atraso`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {projectsByClient.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum projeto cadastrado ainda.</p>
            <button
              onClick={openNewModal}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Criar primeiro projeto
            </button>
          </div>
        )}
      </div>

      {/* Modal de Projeto Unificado */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={closeModal}
        editingProject={editingProject}
        onSuccess={() => {
          closeModal();
          toast.success(editingProject ? 'Projeto atualizado!' : 'Projeto criado!');
        }}
      />
    </div>
  );
}
