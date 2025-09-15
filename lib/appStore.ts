'use client';

import { useSyncExternalStore, useEffect } from 'react';

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

export interface AppState {
  boardActivities: BoardActivity[];
  addBoardActivity: (title: string, extra?: Partial<BoardActivity>) => void;
  updateBoardActivity: (id: string, patch: Partial<BoardActivity>) => void;
  deleteBoardActivity: (id: string) => void;
  
  collaborators: Collaborator[];
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => void;
  updateCollaborator: (id: string, patch: Partial<Collaborator>) => void;
  deleteCollaborator: (id: string) => void;
  
  okrs: OKR[];
  addOKR: (okr: Omit<OKR, 'id'>) => void;
  updateOKR: (id: string, patch: Partial<OKR>) => void;
  deleteOKR: (id: string) => void;
  addOKRActivity: (okrId: string, title: string, assigneeId?: string) => void;
  updateOKRActivity: (okrId: string, activityId: string, patch: Partial<OKR['activities'][0]>) => void;
  deleteOKRActivity: (okrId: string, activityId: string) => void;
  
  rituals: Ritual[];
  addRitual: (title: string) => void;
  updateRitual: (id: string, patch: Partial<Ritual>) => void;
  deleteRitual: (id: string) => void;
  
  // Função para inicializar dados
  initializeFromStorage: () => void;
}

// -------------------- Estado & utils --------------------
const listeners = new Set<() => void>();
let isInitialized = false;

function emit() { 
  listeners.forEach(l => l()); 
}

function saveToStorage() {
  if (typeof window !== 'undefined' && isInitialized) {
    try {
      localStorage.setItem('caaqui-projectops-data', JSON.stringify({
        boardActivities: state.boardActivities,
        collaborators: state.collaborators,
        okrs: state.okrs,
        rituals: state.rituals
      }));
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error);
    }
  }
}

function subscribe(l: () => void) { 
  listeners.add(l); 
  return () => listeners.delete(l); 
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// -------------------- Estado inicial --------------------
let state: AppState = {
  boardActivities: [],
  addBoardActivity(title, extra) {
    const a: BoardActivity = {
      id: uid(),
      title,
      status: extra?.status ?? 'todo',
      assigneeId: extra?.assigneeId,
      description: extra?.description,
      client: extra?.client,
      points: extra?.points,
      createdAt: extra?.createdAt ?? new Date(),
    };
    state = { ...state, boardActivities: [...state.boardActivities, a] };
    emit();
    saveToStorage();
  },
  updateBoardActivity(id, patch) {
    state = {
      ...state,
      boardActivities: state.boardActivities.map(a => a.id === id ? { ...a, ...patch } : a)
    };
    emit();
    saveToStorage();
  },
  deleteBoardActivity(id) {
    state = { ...state, boardActivities: state.boardActivities.filter(a => a.id !== id) };
    emit();
    saveToStorage();
  },

  collaborators: [],
  addCollaborator(collaborator) {
    const c: Collaborator = { ...collaborator, id: uid() };
    state = { ...state, collaborators: [...state.collaborators, c] };
    emit();
    saveToStorage();
  },
  updateCollaborator(id, patch) {
    state = {
      ...state,
      collaborators: state.collaborators.map(c => c.id === id ? { ...c, ...patch } : c)
    };
    emit();
    saveToStorage();
  },
  deleteCollaborator(id) {
    state = { ...state, collaborators: state.collaborators.filter(c => c.id !== id) };
    emit();
    saveToStorage();
  },

  okrs: [],
  addOKR(okr) {
    const o: OKR = { ...okr, id: uid() };
    state = { ...state, okrs: [...state.okrs, o] };
    emit();
    saveToStorage();
  },
  updateOKR(id, patch) {
    state = { ...state, okrs: state.okrs.map(o => o.id === id ? { ...o, ...patch } : o) };
    emit();
    saveToStorage();
  },
  deleteOKR(id) {
    state = { ...state, okrs: state.okrs.filter(o => o.id !== id) };
    emit();
    saveToStorage();
  },
  addOKRActivity(okrId, title, assigneeId) {
    const activity = { id: uid(), title, completed: false, assigneeId };
    state = {
      ...state,
      okrs: state.okrs.map(o => 
        o.id === okrId ? { ...o, activities: [...o.activities, activity] } : o
      )
    };
    emit();
    saveToStorage();
  },
  updateOKRActivity(okrId, activityId, patch) {
    state = {
      ...state,
      okrs: state.okrs.map(o => 
        o.id === okrId ? {
          ...o,
          activities: o.activities.map(a => a.id === activityId ? { ...a, ...patch } : a)
        } : o
      )
    };
    emit();
    saveToStorage();
  },
  deleteOKRActivity(okrId, activityId) {
    state = {
      ...state,
      okrs: state.okrs.map(o => 
        o.id === okrId ? { ...o, activities: o.activities.filter(a => a.id !== activityId) } : o
      )
    };
    emit();
    saveToStorage();
  },

  rituals: [],
  addRitual(title) {
    const r: Ritual = { id: uid(), title, notes: '', createdAt: new Date() };
    state = { ...state, rituals: [...state.rituals, r] };
    emit();
    saveToStorage();
  },
  updateRitual(id, patch) {
    state = { ...state, rituals: state.rituals.map(r => r.id === id ? { ...r, ...patch } : r) };
    emit();
    saveToStorage();
  },
  deleteRitual(id) {
    state = { ...state, rituals: state.rituals.filter(r => r.id !== id) };
    emit();
    saveToStorage();
  },

  initializeFromStorage() {
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        const stored = localStorage.getItem('caaqui-projectops-data');
        if (stored) {
          const savedData = JSON.parse(stored);
          state = {
            ...state,
            boardActivities: savedData.boardActivities || [],
            collaborators: savedData.collaborators || [],
            okrs: savedData.okrs || [],
            rituals: savedData.rituals || []
          };
        }
        isInitialized = true;
        emit();
      } catch (error) {
        console.warn('Erro ao carregar dados do localStorage:', error);
        isInitialized = true;
      }
    }
  }
};

// -------------------- Hook --------------------
export function useAppStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

// Hook para inicializar dados
export function useInitializeStore() {
  useEffect(() => {
    state.initializeFromStorage();
  }, []);
}

export function getState(): AppState { return state; }
export {};
