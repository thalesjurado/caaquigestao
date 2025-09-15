'use client';

import { useSyncExternalStore } from 'react';


// -------------------- Tipos --------------------
export type BoardStatus = 'backlog' | 'todo' | 'doing' | 'review' | 'done';

export type BoardActivity = {
  id: string;
  title: string;
  status: BoardStatus;
  assigneeId?: string;
  description?: string;

  // Campos usados pelos componentes
  client?: string;
  project?: string;
  pillar?: string;
  points?: number;
  due?: string; // ISO string
};

export type Collaborator = {
  id: string;
  name: string;
  role: string;
  email?: string;
};

export type OKR = {
  id: string;
  title: string;
  activities: BoardActivity[];
};

export type Ritual = {
  id: string;
  title: string;
  cadence?: string;
  notes?: string;
};

export type AppState = {
  // Board
  boardActivities: BoardActivity[];
  addBoardActivity: (title: string, extra?: Partial<BoardActivity>) => void;
  deleteBoardActivity: (id: string) => void;
  setBoardStatus: (id: string, status: BoardStatus) => void;

  // Colaboradores
  collaborators: Collaborator[];
  addCollaborator: (name: string, role?: string, email?: string) => void;
  updateCollaborator: (id: string, patch: Partial<Collaborator>) => void;
  deleteCollaborator: (id: string) => void;

  // OKRs
  okrs: OKR[];
  addOKR: (title: string) => void;
  deleteOKR: (okrId: string) => void;
  addOKRActivity: (okrId: string, title: string) => void;
  deleteOKRActivity: (okrId: string, activityId: string) => void;
  setActivityAssignee: (okrId: string, activityId: string, collaboratorId: string | undefined) => void;

  // Rituais
  rituals: Ritual[];
  addRitual: (title: string) => void;
  updateRitual: (id: string, patch: Partial<Ritual>) => void;
  deleteRitual: (id: string) => void;
};

// -------------------- Estado & utils --------------------
const listeners = new Set<() => void>();
function emit() { 
  listeners.forEach(l => l()); 
  // Salva no localStorage após cada mudança
  if (typeof window !== 'undefined') {
    localStorage.setItem('caaqui-projectops-data', JSON.stringify({
      boardActivities: state.boardActivities,
      collaborators: state.collaborators,
      okrs: state.okrs,
      rituals: state.rituals
    }));
  }
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// Função para carregar dados do localStorage
function loadFromStorage(): Partial<AppState> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem('caaqui-projectops-data');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Erro ao carregar dados do localStorage:', error);
  }
  return {};
}

// -------------------- Estado inicial --------------------
const savedData = loadFromStorage();
let state: AppState = {
  boardActivities: savedData.boardActivities || [],
  addBoardActivity(title, extra) {
    const a: BoardActivity = {
      id: uid(),
      title,
      status: extra?.status ?? 'todo',
      assigneeId: extra?.assigneeId,
      description: extra?.description,
      client: extra?.client,
      project: extra?.project,
      pillar: extra?.pillar,
      points: typeof extra?.points === 'number' ? extra.points : undefined,
      due: extra?.due,
    };
    state = { ...state, boardActivities: [...state.boardActivities, a] };
    emit();
  },
  deleteBoardActivity(id) {
    state = { ...state, boardActivities: state.boardActivities.filter(x => x.id !== id) };
    emit();
  },
  setBoardStatus(id, status) {
    state = { ...state, boardActivities: state.boardActivities.map(x => x.id === id ? { ...x, status } : x) };
    emit();
  },

  collaborators: savedData.collaborators || [],
  addCollaborator(name, role, email) {
    const c: Collaborator = { id: uid(), name, role: role ?? 'Sem função', email };
    state = { ...state, collaborators: [...state.collaborators, c] };
    emit();
  },
  updateCollaborator(id, patch) {
    state = { ...state, collaborators: state.collaborators.map(c => c.id === id ? { ...c, ...patch } : c) };
    emit();
  },
  deleteCollaborator(id) {
    state = { ...state, collaborators: state.collaborators.filter(c => c.id !== id) };
    emit();
  },

  okrs: savedData.okrs || [],
  addOKR(title) {
    const okr: OKR = { id: uid(), title, activities: [] };
    state = { ...state, okrs: [...state.okrs, okr] };
    emit();
  },
  deleteOKR(okrId) {
    state = { ...state, okrs: state.okrs.filter(o => o.id !== okrId) };
    emit();
  },
  addOKRActivity(okrId, title) {
    const a: BoardActivity = { id: uid(), title, status: 'todo' };
    state = {
      ...state,
      okrs: state.okrs.map(o => o.id === okrId ? { ...o, activities: [...o.activities, a] } : o),
    };
    emit();
  },
  deleteOKRActivity(okrId, activityId) {
    state = {
      ...state,
      okrs: state.okrs.map(o => o.id === okrId ? { ...o, activities: o.activities.filter(a => a.id !== activityId) } : o),
    };
    emit();
  },
  setActivityAssignee(okrId, activityId, collaboratorId) {
    const collId = collaboratorId ?? undefined;

    // Atualiza no board (se a atividade também estiver lá)
    const board = state.boardActivities.map(a =>
      a.id === activityId ? { ...a, assigneeId: collId } : a
    );

    // Atualiza dentro do OKR específico
    const okrs = state.okrs.map(o =>
      o.id === okrId
        ? { ...o, activities: o.activities.map(a =>
            a.id === activityId ? { ...a, assigneeId: collId } : a
          )
          }
        : o
    );

    state = { ...state, boardActivities: board, okrs };
    emit();
  },

  rituals: savedData.rituals || [],
  addRitual(title) {
    const r: Ritual = { id: uid(), title, cadence: undefined, notes: '' };
    state = { ...state, rituals: [...state.rituals, r] };
    emit();
  },
  updateRitual(id, patch) {
    state = { ...state, rituals: state.rituals.map(r => r.id === id ? { ...r, ...patch } : r) };
    emit();
  },
  deleteRitual(id) {
    state = { ...state, rituals: state.rituals.filter(r => r.id !== id) };
    emit();
  },
};

// -------------------- Hook --------------------
export function useAppStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}
export function getState(): AppState { return state; }
export {};


