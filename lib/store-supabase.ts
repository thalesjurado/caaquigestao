'use client';

import { create } from 'zustand';
import { 
  boardActivitiesAPI, 
  collaboratorsAPI, 
  okrsAPI, 
  ritualsAPI, 
  testConnection,
  SupabaseBoardActivity,
  SupabaseCollaborator,
  SupabaseOKR,
  SupabaseRitual
} from './supabase';

// Tipos locais (mantendo compatibilidade)
export interface BoardActivity {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  assigneeId?: string;
  description?: string;
  client?: string;
  points?: number;
  createdAt?: Date;
  subtasks?: string[];
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface OKR {
  id: string;
  title: string;
  description: string;
  progress: number;
  activities: Array<{
    id: string;
    title: string;
    assigneeId?: string;
  }>;
}

export interface Ritual {
  id: string;
  title: string;
  content?: string;
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
    activities: item.activities || [],
  }),

  ritual: (item: SupabaseRitual): Ritual => ({
    id: item.id,
    title: item.title,
    content: item.content,
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
  }),
};

interface AppState {
  boardActivities: BoardActivity[];
  collaborators: Collaborator[];
  okrs: OKR[];
  rituals: Ritual[];
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
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const useAppStore = create<AppState & AppActions>()((set, get) => ({
  // Estado inicial
  boardActivities: [],
  collaborators: [],
  okrs: [],
  rituals: [],
  isLoading: false,
  error: null,

  // Loading & Error
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Carregar todos os dados do Supabase
  loadAllData: async () => {
    try {
      set({ isLoading: true, error: null });
      
      console.log('🔄 Carregando dados do Supabase...');
      
      // Teste de conexão primeiro
      const connectionOk = await testConnection();
      if (!connectionOk) {
        throw new Error('Falha na conexão com Supabase');
      }
      
      const [boardActivities, collaborators, okrs, rituals] = await Promise.all([
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
      ]);

      console.log('✅ Dados carregados:', {
        boardActivities: boardActivities.length,
        collaborators: collaborators.length,
        okrs: okrs.length,
        rituals: rituals.length
      });

      set({
        boardActivities: boardActivities.map(convertFromSupabase.boardActivity),
        collaborators: collaborators.map(convertFromSupabase.collaborator),
        okrs: okrs.map(convertFromSupabase.okr),
        rituals: rituals.map(convertFromSupabase.ritual),
        isLoading: false,
      });
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error);
      set({ 
        error: `Erro ao conectar com Supabase: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 
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
        points: extra?.points,
        subtasks: extra?.subtasks,
      };

      const created = await boardActivitiesAPI.create(activity);
      const converted = convertFromSupabase.boardActivity(created);
      
      set((state) => ({
        boardActivities: [...state.boardActivities, converted]
      }));
    } catch (error) {
      console.error('Erro ao adicionar atividade:', error);
      set({ error: 'Erro ao adicionar atividade' });
    }
  },

  updateBoardActivity: async (id, patch) => {
    try {
      const supabasePatch = convertToSupabase.boardActivity(patch);
      const updated = await boardActivitiesAPI.update(id, supabasePatch);
      const converted = convertFromSupabase.boardActivity(updated);
      
      set((state) => ({
        boardActivities: state.boardActivities.map(a => 
          a.id === id ? { ...a, ...converted } : a
        )
      }));
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      set({ error: 'Erro ao atualizar atividade' });
    }
  },

  deleteBoardActivity: async (id) => {
    try {
      await boardActivitiesAPI.delete(id);
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
}));

export function getState() { 
  return useAppStore.getState(); 
}

export {};
