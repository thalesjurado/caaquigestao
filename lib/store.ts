'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// -------------------- Tipos --------------------
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
  activities: {
    id: string;
    title: string;
    completed: boolean;
    assigneeId?: string;
  }[];
}

export interface Ritual {
  id: string;
  title: string;
  notes: string;
  createdAt: Date;
}

interface AppState {
  boardActivities: BoardActivity[];
  collaborators: Collaborator[];
  okrs: OKR[];
  rituals: Ritual[];
}

interface AppActions {
  // Board Activities
  addBoardActivity: (activity: Omit<BoardActivity, 'id' | 'createdAt'>) => void;
  updateBoardActivity: (id: string, patch: Partial<BoardActivity>) => void;
  deleteBoardActivity: (id: string) => void;
  
  // Collaborators
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => void;
  updateCollaborator: (id: string, patch: Partial<Collaborator>) => void;
  deleteCollaborator: (id: string) => void;
  
  // OKRs
  addOKR: (okr: Omit<OKR, 'id'>) => void;
  updateOKR: (id: string, patch: Partial<OKR>) => void;
  deleteOKR: (id: string) => void;
  addOKRActivity: (okrId: string, title: string, assigneeId?: string) => void;
  updateOKRActivity: (okrId: string, activityId: string, patch: Partial<OKR['activities'][0]>) => void;
  deleteOKRActivity: (okrId: string, activityId: string) => void;
  
  // Rituals
  addRitual: (title: string) => void;
  updateRitual: (id: string, patch: Partial<Ritual>) => void;
  deleteRitual: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // Estado inicial
      boardActivities: [],
      collaborators: [],
      okrs: [],
      rituals: [],

      // Board Activities
      addBoardActivity: (activity: Omit<BoardActivity, 'id' | 'createdAt'>) => {
        const newActivity: BoardActivity = {
          id: uid(),
          createdAt: new Date(),
          ...activity,
        };
        set((state) => ({
          boardActivities: [...state.boardActivities, newActivity]
        }));
      },

      updateBoardActivity: (id, patch) => {
        set((state) => ({
          boardActivities: state.boardActivities.map(a => 
            a.id === id ? { ...a, ...patch } : a
          )
        }));
      },

      deleteBoardActivity: (id) => {
        set((state) => ({
          boardActivities: state.boardActivities.filter(a => a.id !== id)
        }));
      },

      // Collaborators
      addCollaborator: (collaborator) => {
        const newCollaborator: Collaborator = { ...collaborator, id: uid() };
        set((state) => ({
          collaborators: [...state.collaborators, newCollaborator]
        }));
      },

      updateCollaborator: (id, patch) => {
        set((state) => ({
          collaborators: state.collaborators.map(c => 
            c.id === id ? { ...c, ...patch } : c
          )
        }));
      },

      deleteCollaborator: (id) => {
        set((state) => ({
          collaborators: state.collaborators.filter(c => c.id !== id)
        }));
      },

      // OKRs
      addOKR: (okr) => {
        const newOKR: OKR = { ...okr, id: uid() };
        set((state) => ({
          okrs: [...state.okrs, newOKR]
        }));
      },

      updateOKR: (id, patch) => {
        set((state) => ({
          okrs: state.okrs.map(o => o.id === id ? { ...o, ...patch } : o)
        }));
      },

      deleteOKR: (id) => {
        set((state) => ({
          okrs: state.okrs.filter(o => o.id !== id)
        }));
      },

      addOKRActivity: (okrId, title, assigneeId) => {
        const activity = { id: uid(), title, completed: false, assigneeId };
        set((state) => ({
          okrs: state.okrs.map(o => 
            o.id === okrId 
              ? { ...o, activities: [...o.activities, activity] } 
              : o
          )
        }));
      },

      updateOKRActivity: (okrId, activityId, patch) => {
        set((state) => ({
          okrs: state.okrs.map(o => 
            o.id === okrId 
              ? {
                  ...o,
                  activities: o.activities.map(a => 
                    a.id === activityId ? { ...a, ...patch } : a
                  )
                } 
              : o
          )
        }));
      },

      deleteOKRActivity: (okrId, activityId) => {
        set((state) => ({
          okrs: state.okrs.map(o => 
            o.id === okrId 
              ? { ...o, activities: o.activities.filter(a => a.id !== activityId) } 
              : o
          )
        }));
      },

      // Rituals
      addRitual: (title) => {
        const ritual: Ritual = { 
          id: uid(), 
          title, 
          notes: '', 
          createdAt: new Date() 
        };
        set((state) => ({
          rituals: [...state.rituals, ritual]
        }));
      },

      updateRitual: (id, patch) => {
        set((state) => ({
          rituals: state.rituals.map(r => r.id === id ? { ...r, ...patch } : r)
        }));
      },

      deleteRitual: (id) => {
        set((state) => ({
          rituals: state.rituals.filter(r => r.id !== id)
        }));
      },
    }),
    {
      name: 'caaqui-projectops-data',
      partialize: (state) => ({
        boardActivities: state.boardActivities,
        collaborators: state.collaborators,
        okrs: state.okrs,
        rituals: state.rituals,
      }),
    }
  )
);

export function getState() { 
  return useAppStore.getState(); 
}

export {};
