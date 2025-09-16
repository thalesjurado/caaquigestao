'use client';

import { create } from 'zustand';
import { 
  boardActivitiesAPI, 
  collaboratorsAPI, 
  okrsAPI, 
  ritualsAPI,
  projectsAPI,
  projectAllocationsAPI,
  testConnection,
  SupabaseBoardActivity,
  SupabaseCollaborator,
  SupabaseOKR,
  SupabaseRitual,
  SupabaseProject,
  SupabaseProjectAllocation
} from './supabase';
import { Project, ProjectAllocation, TeamAvailability, ProjectMetrics } from './types';

// Tipos locais (mantendo compatibilidade)
export interface BoardActivity {
  id: string;
  title: string;
  status: 'backlog' | 'todo' | 'doing' | 'done' | 'historical';
  assigneeId?: string;
  description?: string;
  client?: string;
  projectId?: string;
  points?: number;
  createdAt?: Date;
  dueDate?: Date;
  subtasks?: string[];
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  hourlyRate?: number;
  maxAllocation?: number;
}

export interface OKR {
  id: string;
  title: string;
  description: string;
  progress: number;
  quarter: string;
  activities: Array<{
    id: string;
    title: string;
    assigneeId?: string;
    projectId?: string;
  }>;
}

export interface Ritual {
  id: string;
  title: string;
  content?: string;
  frequency?: string;
  nextDate?: Date;
}

// Funções de conversão entre tipos locais e Supabase
const convertFromSupabase = {
  boardActivity: (item: SupabaseBoardActivity): BoardActivity => ({
    id: item.id,
    title: item.title,
    status: item.status,
    assigneeId: item.assignee_id,
    description: item.description,
    client: item.client,
    points: item.points,
    createdAt: item.created_at ? new Date(item.created_at) : undefined,
    subtasks: item.subtasks,
  }),

  collaborator: (item: SupabaseCollaborator): Collaborator => ({
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
    avatar: item.avatar,
  }),

  okr: (item: SupabaseOKR): OKR => ({
    id: item.id,
    title: item.title,
    description: item.description,
    progress: item.progress,
    quarter: 'Q1 2024', // Default value, será atualizado quando expandirmos
    activities: item.activities || [],
  }),

  ritual: (item: SupabaseRitual): Ritual => ({
    id: item.id,
    title: item.title,
    content: item.content,
    frequency: item.frequency,
    nextDate: item.next_date ? new Date(item.next_date) : undefined,
  }),

  project: (item: SupabaseProject): Project => ({
    id: item.id,
    name: item.name,
    client: item.client,
    type: item.type,
    status: item.status,
    startDate: new Date(item.start_date),
    endDate: new Date(item.end_date),
    description: item.description,
    budget: item.budget,
    allocations: [], // Será preenchido separadamente
    techDetails: item.tech_details,
    growthDetails: item.growth_details,
  }),

  projectAllocation: (item: SupabaseProjectAllocation): ProjectAllocation => ({
    id: item.id,
    projectId: item.project_id,
    collaboratorId: item.collaborator_id,
    percentage: item.percentage,
    role: item.role,
    startDate: new Date(item.start_date),
    endDate: new Date(item.end_date),
  }),
};

const convertToSupabase = {
  boardActivity: (item: Partial<BoardActivity>): Partial<SupabaseBoardActivity> => ({
    id: item.id,
    title: item.title,
    status: item.status,
    assignee_id: item.assigneeId,
    description: item.description,
    client: item.client,
    points: item.points,
    subtasks: item.subtasks,
  }),

  collaborator: (item: Partial<Collaborator>): Partial<SupabaseCollaborator> => ({
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
    avatar: item.avatar,
  }),

  okr: (item: Partial<OKR>): Partial<SupabaseOKR> => ({
    id: item.id,
    title: item.title,
    description: item.description,
    progress: item.progress,
    activities: item.activities,
  }),

  ritual: (item: Partial<Ritual>): Partial<SupabaseRitual> => ({
    id: item.id,
    title: item.title,
    content: item.content,
    frequency: item.frequency,
    next_date: item.nextDate?.toISOString(),
  }),

  project: (item: Partial<Project>): Partial<SupabaseProject> => ({
    id: item.id,
    name: item.name,
    client: item.client,
    type: item.type,
    status: item.status,
    start_date: item.startDate?.toISOString(),
    end_date: item.endDate?.toISOString(),
    description: item.description,
    budget: item.budget,
    tech_details: item.techDetails,
    growth_details: item.growthDetails,
  }),

  projectAllocation: (item: Partial<ProjectAllocation>): Partial<SupabaseProjectAllocation> => ({
    id: item.id,
    project_id: item.projectId,
    collaborator_id: item.collaboratorId,
    percentage: item.percentage,
    role: item.role,
    start_date: item.startDate?.toISOString(),
    end_date: item.endDate?.toISOString(),
  }),
};

interface AppState {
  boardActivities: BoardActivity[];
  collaborators: Collaborator[];
  okrs: OKR[];
  rituals: Ritual[];
  projects: Project[];
  projectAllocations: ProjectAllocation[];
  isLoading: boolean;
  error: string | null;
}

interface AppActions {
  // Loading & Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Initialize data from Supabase
  loadAllData: () => Promise<void>;
  
  // Board Activities
  addBoardActivity: (title: string, extra?: Partial<BoardActivity>) => Promise<void>;
  updateBoardActivity: (id: string, patch: Partial<BoardActivity>) => Promise<void>;
  deleteBoardActivity: (id: string) => Promise<void>;
  
  // Collaborators
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<void>;
  updateCollaborator: (id: string, patch: Partial<Collaborator>) => Promise<void>;
  deleteCollaborator: (id: string) => Promise<void>;
  
  // OKRs
  addOKR: (okr: Omit<OKR, 'id'>) => Promise<void>;
  updateOKR: (id: string, patch: Partial<OKR>) => Promise<void>;
  deleteOKR: (id: string) => Promise<void>;
  addOKRActivity: (okrId: string, title: string, assigneeId?: string) => Promise<void>;
  updateOKRActivity: (okrId: string, activityId: string, patch: Partial<OKR['activities'][0]>) => Promise<void>;
  deleteOKRActivity: (okrId: string, activityId: string) => Promise<void>;
  
  // Rituals
  addRitual: (title: string) => Promise<void>;
  updateRitual: (id: string, patch: Partial<Ritual>) => Promise<void>;
  deleteRitual: (id: string) => Promise<void>;
  
  // Projects
  addProject: (project: Omit<Project, 'id' | 'allocations'>) => Promise<void>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Project Allocations
  addProjectAllocation: (allocation: Omit<ProjectAllocation, 'id'>) => Promise<void>;
  updateProjectAllocation: (id: string, patch: Partial<ProjectAllocation>) => Promise<void>;
  deleteProjectAllocation: (id: string) => Promise<void>;
  
  // Utility functions
  getTeamAvailability: () => TeamAvailability[];
  getProjectMetrics: () => ProjectMetrics[];
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const useAppStore = create<AppState & AppActions>()((set, get) => ({
  // Estado inicial
  boardActivities: [],
  collaborators: [],
  okrs: [],
  rituals: [],
  projects: [],
  projectAllocations: [],
  isLoading: false,
  error: null,

  // Loading & Error
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Initialize data from Supabase
  loadAllData: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Inicializa dados de fallback se necessário
      if (typeof window !== 'undefined') {
        const { initializeFallbackData } = await import('./init-fallback-data');
        initializeFallbackData();
      }
      
      const connectionOk = await testConnection();
      if (!connectionOk) {
        throw new Error('Falha na conexão com Supabase');
      }

      const [boardActivities, collaborators, okrs, rituals, projects, projectAllocations] = await Promise.all([
        boardActivitiesAPI.getAll().catch(err => {
          console.error('Erro ao carregar boardActivities:', err);
          return [];
        }),
        collaboratorsAPI.getAll().catch(err => {
          console.error('Erro ao carregar collaborators:', err);
          return [];
        }),
        okrsAPI.getAll().catch(err => {
          console.error('Erro ao carregar okrs:', err);
          return [];
        }),
        ritualsAPI.getAll().catch(err => {
          console.error('Erro ao carregar rituals:', err);
          return [];
        }),
        projectsAPI.getAll().catch(err => {
          console.error('Erro ao carregar projects:', err);
          return [];
        }),
        projectAllocationsAPI.getAll().catch(err => {
          console.error('Erro ao carregar project_allocations:', err);
          return [];
        }),
      ]);

      // Se projects, projectAllocations ou boardActivities estão vazios, tenta carregar do localStorage
      let finalProjects = projects;
      let finalProjectAllocations = projectAllocations;
      let finalBoardActivities = boardActivities;

      if (projects.length === 0) {
        try {
          const localProjects = localStorage.getItem('caaqui_projects');
          if (localProjects) {
            finalProjects = JSON.parse(localProjects);
            console.log('📦 Carregando projects do localStorage:', finalProjects.length);
          } else {
            // Se não há dados no localStorage, inicializa dados de fallback
            console.log('🔄 Inicializando dados de fallback para projects...');
            const { initializeFallbackData } = await import('./init-fallback-data');
            initializeFallbackData();
            const newLocalProjects = localStorage.getItem('caaqui_projects');
            if (newLocalProjects) {
              finalProjects = JSON.parse(newLocalProjects);
              console.log('✅ Dados de fallback criados para projects:', finalProjects.length);
            }
          }
        } catch (err) {
          console.warn('Erro ao carregar projects do localStorage:', err);
        }
      }

      if (projectAllocations.length === 0) {
        try {
          const localAllocations = localStorage.getItem('caaqui_project_allocations');
          if (localAllocations) {
            finalProjectAllocations = JSON.parse(localAllocations);
            console.log('📦 Carregando project_allocations do localStorage:', finalProjectAllocations.length);
          } else {
            // Se não há dados no localStorage, inicializa dados de fallback
            console.log('🔄 Inicializando dados de fallback para project_allocations...');
            const { initializeFallbackData } = await import('./init-fallback-data');
            initializeFallbackData();
            const newLocalAllocations = localStorage.getItem('caaqui_project_allocations');
            if (newLocalAllocations) {
              finalProjectAllocations = JSON.parse(newLocalAllocations);
              console.log('✅ Dados de fallback criados para project_allocations:', finalProjectAllocations.length);
            }
          }
        } catch (err) {
          console.warn('Erro ao carregar project_allocations do localStorage:', err);
        }
      }

      if (boardActivities.length === 0) {
        try {
          const localActivities = localStorage.getItem('caaqui_board_activities');
          if (localActivities) {
            finalBoardActivities = JSON.parse(localActivities);
            console.log('📦 Carregando board_activities do localStorage:', finalBoardActivities.length);
          }
        } catch (err) {
          console.warn('Erro ao carregar board_activities do localStorage:', err);
        }
      }

      set({
        boardActivities: finalBoardActivities.length > 0 ? (finalBoardActivities[0]?.id ? finalBoardActivities.map(convertFromSupabase.boardActivity) : finalBoardActivities) : [],
        collaborators: collaborators.map(convertFromSupabase.collaborator),
        okrs: okrs.map(convertFromSupabase.okr),
        rituals: rituals.map(convertFromSupabase.ritual),
        projects: finalProjects.length > 0 ? (finalProjects[0]?.id ? finalProjects.map(convertFromSupabase.project) : finalProjects) : [],
        projectAllocations: finalProjectAllocations.length > 0 ? (finalProjectAllocations[0]?.id ? finalProjectAllocations.map(convertFromSupabase.projectAllocation) : finalProjectAllocations) : [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
      set({ 
        error: `Erro ao conectar com Supabase: ${(error as Error).message}`, 
        isLoading: false 
      });
    }
  },
  // Board Activities
  addBoardActivity: async (title, extra) => {
    try {
      const activity = {
        id: uid(),
        title,
        status: extra?.status ?? 'todo' as const,
        assignee_id: extra?.assigneeId,
        description: extra?.description,
        client: extra?.client,
        project_id: extra?.projectId,
        points: extra?.points,
        subtasks: extra?.subtasks,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Tenta criar no Supabase primeiro
      try {
        const created = await boardActivitiesAPI.create(activity);
        const converted = convertFromSupabase.boardActivity(created);
        
        set((state) => ({
          boardActivities: [...state.boardActivities, converted]
        }));
      } catch {
        console.warn('⚠️ Erro ao criar atividade no Supabase, usando localStorage');
        
        // Fallback: salva no localStorage
        const localActivities = JSON.parse(localStorage.getItem('caaqui_board_activities') || '[]');
        localActivities.push(activity);
        localStorage.setItem('caaqui_board_activities', JSON.stringify(localActivities));
        
        // Atualiza estado local
        const converted = convertFromSupabase.boardActivity(activity);
        set((state) => ({
          boardActivities: [...state.boardActivities, converted]
        }));
      }
    } catch (error) {
      console.error('Erro ao adicionar atividade:', error);
      set({ error: 'Erro ao adicionar atividade' });
    }
  },

  updateBoardActivity: async (id, patch) => {
    try {
      // Tenta atualizar no Supabase primeiro
      try {
        const supabasePatch = convertToSupabase.boardActivity(patch);
        const updated = await boardActivitiesAPI.update(id, supabasePatch);
        const converted = convertFromSupabase.boardActivity(updated);
        
        set((state) => ({
          boardActivities: state.boardActivities.map(a => 
            a.id === id ? { ...a, ...converted } : a
          )
        }));
      } catch {
        console.warn('⚠️ Erro ao atualizar atividade no Supabase, usando localStorage');
        
        // Fallback: atualiza no localStorage
        const updatedActivity = { ...patch, id, updatedAt: new Date() };
        
        set((state) => ({
          boardActivities: state.boardActivities.map(a => 
            a.id === id ? { ...a, ...updatedActivity } : a
          )
        }));
        
        // Atualiza localStorage
        const localActivities = JSON.parse(localStorage.getItem('caaqui_board_activities') || '[]');
        const updatedLocalActivities = localActivities.map((a: { id: string }) => 
          a.id === id ? { ...a, ...convertToSupabase.boardActivity(updatedActivity) } : a
        );
        localStorage.setItem('caaqui_board_activities', JSON.stringify(updatedLocalActivities));
      }
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      set({ error: 'Erro ao atualizar atividade' });
    }
  },

  deleteBoardActivity: async (id) => {
    try {
      // Tenta deletar no Supabase primeiro
      try {
        await boardActivitiesAPI.delete(id);
      } catch {
        console.warn('⚠️ Erro ao deletar atividade no Supabase, usando localStorage');
        
        // Fallback: remove do localStorage
        const localActivities = JSON.parse(localStorage.getItem('caaqui_board_activities') || '[]');
        const filteredActivities = localActivities.filter((a: { id: string }) => a.id !== id);
        localStorage.setItem('caaqui_board_activities', JSON.stringify(filteredActivities));
      }
      
      // Remove do estado local sempre
      set((state) => ({
        boardActivities: state.boardActivities.filter(a => a.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      set({ error: 'Erro ao deletar atividade' });
    }
  },

  // Collaborators
  addCollaborator: async (collaborator) => {
    try {
      const newCollaborator = {
        id: uid(),
        ...collaborator,
      };

      const created = await collaboratorsAPI.create(newCollaborator);
      const converted = convertFromSupabase.collaborator(created);
      
      set((state) => ({
        collaborators: [...state.collaborators, converted]
      }));
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
      set({ error: 'Erro ao adicionar colaborador' });
    }
  },

  updateCollaborator: async (id, patch) => {
    try {
      const supabasePatch = convertToSupabase.collaborator(patch);
      const updated = await collaboratorsAPI.update(id, supabasePatch);
      const converted = convertFromSupabase.collaborator(updated);
      
      set((state) => ({
        collaborators: state.collaborators.map(c => 
          c.id === id ? { ...c, ...converted } : c
        )
      }));
    } catch (error) {
      console.error('Erro ao atualizar colaborador:', error);
      set({ error: 'Erro ao atualizar colaborador' });
    }
  },

  deleteCollaborator: async (id) => {
    try {
      await collaboratorsAPI.delete(id);
      set((state) => ({
        collaborators: state.collaborators.filter(c => c.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar colaborador:', error);
      set({ error: 'Erro ao deletar colaborador' });
    }
  },

  // OKRs
  addOKR: async (okr) => {
    try {
      const newOKR = {
        id: uid(),
        ...okr,
      };

      const created = await okrsAPI.create(newOKR);
      const converted = convertFromSupabase.okr(created);
      
      set((state) => ({
        okrs: [...state.okrs, converted]
      }));
    } catch (error) {
      console.error('Erro ao adicionar OKR:', error);
      set({ error: 'Erro ao adicionar OKR' });
    }
  },

  updateOKR: async (id, patch) => {
    try {
      const supabasePatch = convertToSupabase.okr(patch);
      const updated = await okrsAPI.update(id, supabasePatch);
      const converted = convertFromSupabase.okr(updated);
      
      set((state) => ({
        okrs: state.okrs.map(o => 
          o.id === id ? { ...o, ...converted } : o
        )
      }));
    } catch (error) {
      console.error('Erro ao atualizar OKR:', error);
      set({ error: 'Erro ao atualizar OKR' });
    }
  },

  deleteOKR: async (id) => {
    try {
      await okrsAPI.delete(id);
      set((state) => ({
        okrs: state.okrs.filter(o => o.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar OKR:', error);
      set({ error: 'Erro ao deletar OKR' });
    }
  },

  addOKRActivity: async (okrId, title, assigneeId) => {
    try {
      const state = get();
      const okr = state.okrs.find(o => o.id === okrId);
      if (!okr) return;

      const newActivity = {
        id: uid(),
        title,
        assigneeId,
      };

      const updatedActivities = [...okr.activities, newActivity];
      await get().updateOKR(okrId, { activities: updatedActivities });
    } catch (error) {
      console.error('Erro ao adicionar atividade OKR:', error);
      set({ error: 'Erro ao adicionar atividade OKR' });
    }
  },

  updateOKRActivity: async (okrId, activityId, patch) => {
    try {
      const state = get();
      const okr = state.okrs.find(o => o.id === okrId);
      if (!okr) return;

      const updatedActivities = okr.activities.map(a =>
        a.id === activityId ? { ...a, ...patch } : a
      );
      
      await get().updateOKR(okrId, { activities: updatedActivities });
    } catch (error) {
      console.error('Erro ao atualizar atividade OKR:', error);
      set({ error: 'Erro ao atualizar atividade OKR' });
    }
  },

  deleteOKRActivity: async (okrId, activityId) => {
    try {
      const state = get();
      const okr = state.okrs.find(o => o.id === okrId);
      if (!okr) return;

      const updatedActivities = okr.activities.filter(a => a.id !== activityId);
      await get().updateOKR(okrId, { activities: updatedActivities });
    } catch (error) {
      console.error('Erro ao deletar atividade OKR:', error);
      set({ error: 'Erro ao deletar atividade OKR' });
    }
  },

  // Rituals
  addRitual: async (title) => {
    try {
      const ritual = {
        id: uid(),
        title,
      };

      const created = await ritualsAPI.create(ritual);
      const converted = convertFromSupabase.ritual(created);
      
      set((state) => ({
        rituals: [...state.rituals, converted]
      }));
    } catch (error) {
      console.error('Erro ao adicionar ritual:', error);
      set({ error: 'Erro ao adicionar ritual' });
    }
  },

  updateRitual: async (id, patch) => {
    try {
      const supabasePatch = convertToSupabase.ritual(patch);
      const updated = await ritualsAPI.update(id, supabasePatch);
      const converted = convertFromSupabase.ritual(updated);
      
      set((state) => ({
        rituals: state.rituals.map(r => 
          r.id === id ? { ...r, ...converted } : r
        )
      }));
    } catch (error) {
      console.error('Erro ao atualizar ritual:', error);
      set({ error: 'Erro ao atualizar ritual' });
    }
  },

  deleteRitual: async (id) => {
    try {
      await ritualsAPI.delete(id);
      set((state) => ({
        rituals: state.rituals.filter(r => r.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar ritual:', error);
      set({ error: 'Erro ao deletar ritual' });
    }
  },

  // Projects
  addProject: async (project) => {
    try {
      const newProject = {
        id: uid(),
        ...project,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Tenta criar no Supabase primeiro
      try {
        const supabaseProject = convertToSupabase.project(newProject) as Omit<SupabaseProject, 'created_at' | 'updated_at'>;
        const created = await projectsAPI.create(supabaseProject);
        const converted = convertFromSupabase.project(created);
        
        set((state) => ({
          projects: [...state.projects, converted]
        }));
      } catch {
        console.warn('⚠️ Erro ao criar projeto no Supabase, usando localStorage');
        
        // Fallback: salva no localStorage
        const localProjects = JSON.parse(localStorage.getItem('caaqui_projects') || '[]');
        const supabaseProject = convertToSupabase.project(newProject);
        localProjects.push(supabaseProject);
        localStorage.setItem('caaqui_projects', JSON.stringify(localProjects));
        
        // Atualiza estado local
        const projectWithAllocations = { ...newProject, allocations: [] };
        set((state) => ({
          projects: [...state.projects, projectWithAllocations]
        }));
      }
    } catch (error) {
      console.error('Erro ao adicionar projeto:', error);
      set({ error: 'Erro ao adicionar projeto' });
    }
  },

  updateProject: async (id, patch) => {
    try {
      // Tenta atualizar no Supabase primeiro
      try {
        const supabasePatch = convertToSupabase.project(patch);
        const updated = await projectsAPI.update(id, supabasePatch);
        const converted = convertFromSupabase.project(updated);
        
        set((state) => ({
          projects: state.projects.map(p => 
            p.id === id ? { ...p, ...converted } : p
          )
        }));
      } catch {
        console.warn('⚠️ Erro ao atualizar no Supabase, usando localStorage');
        
        // Fallback: atualiza no localStorage
        const updatedProject = { ...patch, id, updatedAt: new Date() };
        
        set((state) => ({
          projects: state.projects.map(p => 
            p.id === id ? { ...p, ...updatedProject } : p
          )
        }));
        
        // Atualiza localStorage
        const localProjects = JSON.parse(localStorage.getItem('caaqui_projects') || '[]');
        const updatedLocalProjects = localProjects.map((p: { id: string }) => 
          p.id === id ? { ...p, ...convertToSupabase.project(updatedProject) } : p
        );
        localStorage.setItem('caaqui_projects', JSON.stringify(updatedLocalProjects));
      }
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      set({ error: 'Erro ao atualizar projeto' });
    }
  },

  deleteProject: async (id) => {
    try {
      // Tenta deletar no Supabase primeiro
      try {
        await projectsAPI.delete(id);
      } catch {
        console.warn('⚠️ Erro ao deletar no Supabase, usando localStorage');
        
        // Fallback: remove do localStorage
        const localProjects = JSON.parse(localStorage.getItem('caaqui_projects') || '[]');
        const filteredProjects = localProjects.filter((p: { id: string }) => p.id !== id);
        localStorage.setItem('caaqui_projects', JSON.stringify(filteredProjects));
      }
      
      // Remove do estado local sempre
      set((state) => ({
        projects: state.projects.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      set({ error: 'Erro ao deletar projeto' });
    }
  },

  // Project Allocations
  addProjectAllocation: async (allocation) => {
    try {
      const newAllocation = {
        id: uid(),
        ...allocation,
      };

      // Tenta criar no Supabase primeiro
      try {
        const supabaseAllocation = convertToSupabase.projectAllocation(newAllocation) as Omit<SupabaseProjectAllocation, 'created_at' | 'updated_at'>;
        const created = await projectAllocationsAPI.create(supabaseAllocation);
        const converted = convertFromSupabase.projectAllocation(created);
        
        set((state) => ({
          projectAllocations: [...state.projectAllocations, converted]
        }));
      } catch {
        console.warn('⚠️ Erro ao criar alocação no Supabase, usando localStorage');
        
        // Fallback: salva no localStorage
        const localAllocations = JSON.parse(localStorage.getItem('caaqui_project_allocations') || '[]');
        const supabaseAllocation = convertToSupabase.projectAllocation(newAllocation);
        localAllocations.push(supabaseAllocation);
        localStorage.setItem('caaqui_project_allocations', JSON.stringify(localAllocations));
        
        // Atualiza estado local
        set((state) => ({
          projectAllocations: [...state.projectAllocations, newAllocation]
        }));
      }
    } catch (error) {
      console.error('Erro ao adicionar alocação:', error);
      set({ error: 'Erro ao adicionar alocação' });
    }
  },

  updateProjectAllocation: async (id, patch) => {
    try {
      // Tenta atualizar no Supabase primeiro
      try {
        const supabasePatch = convertToSupabase.projectAllocation(patch);
        const updated = await projectAllocationsAPI.update(id, supabasePatch);
        const converted = convertFromSupabase.projectAllocation(updated);
        
        set((state) => ({
          projectAllocations: state.projectAllocations.map(a => 
            a.id === id ? { ...a, ...converted } : a
          )
        }));
      } catch {
        console.warn('⚠️ Erro ao atualizar alocação no Supabase, usando localStorage');
        
        // Fallback: atualiza no localStorage
        const updatedAllocation = { ...patch, id, updatedAt: new Date() };
        
        set((state) => ({
          projectAllocations: state.projectAllocations.map(a => 
            a.id === id ? { ...a, ...updatedAllocation } : a
          )
        }));
        
        // Atualiza localStorage
        const localAllocations = JSON.parse(localStorage.getItem('caaqui_project_allocations') || '[]');
        const updatedLocalAllocations = localAllocations.map((a: { id: string }) => 
          a.id === id ? { ...a, ...convertToSupabase.projectAllocation(updatedAllocation) } : a
        );
        localStorage.setItem('caaqui_project_allocations', JSON.stringify(updatedLocalAllocations));
      }
    } catch (error) {
      console.error('Erro ao atualizar alocação:', error);
      set({ error: 'Erro ao atualizar alocação' });
    }
  },

  deleteProjectAllocation: async (id) => {
    try {
      // Tenta deletar no Supabase primeiro
      try {
        await projectAllocationsAPI.delete(id);
      } catch {
        console.warn('⚠️ Erro ao deletar alocação no Supabase, usando localStorage');
        
        // Fallback: remove do localStorage
        const localAllocations = JSON.parse(localStorage.getItem('caaqui_project_allocations') || '[]');
        const filteredAllocations = localAllocations.filter((a: { id: string }) => a.id !== id);
        localStorage.setItem('caaqui_project_allocations', JSON.stringify(filteredAllocations));
      }
      
      // Remove do estado local sempre
      set((state) => ({
        projectAllocations: state.projectAllocations.filter(a => a.id !== id)
      }));
    } catch (error) {
      console.error('Erro ao deletar alocação:', error);
      set({ error: 'Erro ao deletar alocação' });
    }
  },

  // Utility functions
  getTeamAvailability: () => {
    const state = get();
    const availability: TeamAvailability[] = [];
    
    console.log('🔍 Debug disponibilidade detalhado:');
    console.log('- Total collaborators:', state.collaborators.length);
    console.log('- Total projectAllocations:', state.projectAllocations.length);
    console.log('- Total projects:', state.projects.length);
    
    state.collaborators.forEach(collaborator => {
      console.log(`\n👤 Analisando ${collaborator.name} (${collaborator.id}):`);
      
      // Filtra apenas alocações ativas (projetos não finalizados)
      const now = new Date();
      const allAllocationsForUser = state.projectAllocations.filter(a => a.collaboratorId === collaborator.id);
      console.log(`- Total alocações para ${collaborator.name}:`, allAllocationsForUser.length);
      
      allAllocationsForUser.forEach(alloc => {
        const project = state.projects.find(p => p.id === alloc.projectId);
        const isActive = new Date(alloc.endDate) > now;
        console.log(`  • Projeto: ${project?.name || 'NÃO ENCONTRADO'} (${alloc.projectId})`);
        console.log(`    - Percentual: ${alloc.percentage}%`);
        console.log(`    - Ativo: ${isActive}`);
        console.log(`    - Data fim: ${alloc.endDate}`);
      });
      
      const activeAllocations = allAllocationsForUser.filter(a => {
        const isActive = new Date(a.endDate) > now;
        return isActive;
      });
      
      const totalAllocation = activeAllocations.reduce((sum, a) => sum + a.percentage, 0);
      const maxAllocation = collaborator.maxAllocation || 100;
      
      const projectDetails = activeAllocations.map(allocation => {
        const project = state.projects.find(p => p.id === allocation.projectId);
        return {
          projectId: allocation.projectId,
          projectName: project?.name || 'Projeto não encontrado',
          allocation: allocation.percentage,
          endDate: allocation.endDate
        };
      });

      availability.push({
        collaboratorId: collaborator.id,
        name: collaborator.name,
        role: collaborator.role,
        totalAllocation: Math.min(totalAllocation, maxAllocation),
        availableAllocation: Math.max(0, maxAllocation - totalAllocation),
        projects: projectDetails
      });
    });

    return availability;
  },

  getProjectMetrics: () => {
    const state = get();
    const metrics: ProjectMetrics[] = [];
    
    state.projects.forEach(project => {
      const tasks = state.boardActivities.filter(a => a.projectId === project.id);
      const completedTasks = tasks.filter(a => a.status === 'done').length;
      const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
      
      const now = new Date();
      const daysRemaining = Math.ceil((project.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isOnTime = daysRemaining >= 0 && progress >= 50; // Heurística simples
      
      const allocations = state.projectAllocations.filter(a => a.projectId === project.id);
      const teamSize = allocations.length;
      const totalAllocation = allocations.reduce((sum, a) => sum + a.percentage, 0);

      metrics.push({
        projectId: project.id,
        name: project.name,
        client: project.client,
        type: project.type,
        status: project.status,
        progress,
        daysRemaining,
        isOnTime,
        teamSize,
        totalAllocation
      });
    });

    return metrics;
  },
}));

export function getState() { 
  return useAppStore.getState(); 
}

export {};
