'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAppStore as useSupabaseStore } from './store-supabase';

// Tipos (mantendo compatibilidade)
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

// Store com localStorage como fallback
const useLocalStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
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
      loadAllData: async () => {
        // Para localStorage, não precisa carregar nada
        set({ isLoading: false, error: null });
      },

      // Board Activities
      addBoardActivity: async (title, extra) => {
        const activity: BoardActivity = {
          id: uid(),
          title,
          status: extra?.status ?? 'todo',
          assigneeId: extra?.assigneeId,
          description: extra?.description,
          client: extra?.client,
          points: extra?.points,
          createdAt: extra?.createdAt ?? new Date(),
          subtasks: extra?.subtasks,
        };
        set((state) => ({
          boardActivities: [...state.boardActivities, activity]
        }));
      },

      updateBoardActivity: async (id, patch) => {
        set((state) => ({
          boardActivities: state.boardActivities.map(a => 
            a.id === id ? { ...a, ...patch } : a
          )
        }));
      },

      deleteBoardActivity: async (id) => {
        set((state) => ({
          boardActivities: state.boardActivities.filter(a => a.id !== id)
        }));
      },

      // Collaborators
      addCollaborator: async (collaborator) => {
        const newCollaborator: Collaborator = {
          id: uid(),
          ...collaborator,
        };
        set((state) => ({
          collaborators: [...state.collaborators, newCollaborator]
        }));
      },

      updateCollaborator: async (id, patch) => {
        set((state) => ({
          collaborators: state.collaborators.map(c => 
            c.id === id ? { ...c, ...patch } : c
          )
        }));
      },

      deleteCollaborator: async (id) => {
        set((state) => ({
          collaborators: state.collaborators.filter(c => c.id !== id)
        }));
      },

      // OKRs
      addOKR: async (okr) => {
        const newOKR: OKR = {
          id: uid(),
          ...okr,
        };
        set((state) => ({
          okrs: [...state.okrs, newOKR]
        }));
      },

      updateOKR: async (id, patch) => {
        set((state) => ({
          okrs: state.okrs.map(o => 
            o.id === id ? { ...o, ...patch } : o
          )
        }));
      },

      deleteOKR: async (id) => {
        set((state) => ({
          okrs: state.okrs.filter(o => o.id !== id)
        }));
      },

      addOKRActivity: async (okrId, title, assigneeId) => {
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
      },

      updateOKRActivity: async (okrId, activityId, patch) => {
        const state = get();
        const okr = state.okrs.find(o => o.id === okrId);
        if (!okr) return;

        const updatedActivities = okr.activities.map(a =>
          a.id === activityId ? { ...a, ...patch } : a
        );
        
        await get().updateOKR(okrId, { activities: updatedActivities });
      },

      deleteOKRActivity: async (okrId, activityId) => {
        const state = get();
        const okr = state.okrs.find(o => o.id === okrId);
        if (!okr) return;

        const updatedActivities = okr.activities.filter(a => a.id !== activityId);
        await get().updateOKR(okrId, { activities: updatedActivities });
      },

      // Rituals
      addRitual: async (title) => {
        const ritual: Ritual = {
          id: uid(),
          title,
        };
        set((state) => ({
          rituals: [...state.rituals, ritual]
        }));
      },

      updateRitual: async (id, patch) => {
        set((state) => ({
          rituals: state.rituals.map(r => 
            r.id === id ? { ...r, ...patch } : r
          )
        }));
      },

      deleteRitual: async (id) => {
        set((state) => ({
          rituals: state.rituals.filter(r => r.id !== id)
        }));
      },
    }),
    {
      name: 'caaqui-projectops-fallback',
      partialize: (state) => ({
        boardActivities: state.boardActivities,
        collaborators: state.collaborators,
        okrs: state.okrs,
        rituals: state.rituals,
      }),
    }
  )
);

// Hook inteligente que tenta Supabase primeiro, fallback para localStorage
export const useAppStore = (selector: any) => {
  const supabaseError = useSupabaseStore(s => s.error);
  
  // Se Supabase tem erro, usa localStorage
  if (supabaseError) {
    return useLocalStore(selector);
  }
  
  // Senão, usa Supabase
  return useSupabaseStore(selector);
};

export function getState() { 
  return useSupabaseStore.getState(); 
}

export {};
