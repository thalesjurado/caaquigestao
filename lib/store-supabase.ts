'use client';

import { create } from 'zustand';
import { 
  boardActivitiesAPI, 
  collaboratorsAPI, 
  okrsAPI, 
  ritualsAPI,
  projectsAPI,
  projectAllocationsAPI,
  sprintsAPI,
  sprintEntriesAPI,
  testConnection,
  supabase,
  SupabaseBoardActivity,
  SupabaseCollaborator,
  SupabaseOKR,
  SupabaseRitual,
  SupabaseProject,
  SupabaseProjectAllocation,
  SupabaseSprint,
  SupabaseSprintEntry
} from './supabase';
import { Project, ProjectAllocation, TeamAvailability, ProjectMetrics, Sprint, SprintEntry } from './types';
import { saveToStorage, loadFromStorage, STORAGE_KEYS, setupStorageSync } from './data-sync';
import { notificationService } from './notifications';

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
  accessLevel: 'operations' | 'management' | 'executive';
  position: string;
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
  projectId?: string;
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
    // Mapear os novos campos persistidos no Supabase
    hourlyRate: (item as any).hourly_rate,
    accessLevel: ((item as any).access_level as any) || 'operations',
    position: (item as any).position || item.role || 'Membro',
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
    projectId: (item as any).project_id,
  }),

  project: (item: SupabaseProject): Project => ({
    id: item.id,
    name: item.name,
    client: item.client,
    type: item.type === 'tech_implementation' ? 'tech' : 'growth',
    status: item.status as Project['status'],
    startDate: new Date(item.start_date),
    endDate: new Date(item.end_date),
    description: item.description,
    budget: item.budget,
    allocations: [], // Será preenchido separadamente
    archivedAt: (item as any).archived_at ? new Date((item as any).archived_at) : undefined,
    techDetails: item.tech_details,
    growthDetails: item.growth_details,
  }),

  projectAllocation: (item: SupabaseProjectAllocation): ProjectAllocation => ({
    id: item.id,
    projectId: item.project_id,
    collaboratorId: item.collaborator_id,
    percentage: item.percentage,
    role: item.role,
    hourType: (item.hour_type as any) || 'billable',
    plannedHoursMonthly: item.planned_hours_monthly ?? undefined,
    startDate: new Date(item.start_date),
    endDate: new Date(item.end_date),
  }),

  sprint: (item: SupabaseSprint): Sprint => ({
    id: item.id,
    projectId: item.project_id,
    number: item.number,
    name: item.name ?? undefined,
    startDate: new Date(item.start_date),
    endDate: new Date(item.end_date),
    objective: item.objective ?? undefined,
    status: item.status,
    plannedHoursBillable: item.planned_hours_billable ?? undefined,
    plannedHoursNonBillable: item.planned_hours_non_billable ?? undefined,
    plannedHoursProduct: item.planned_hours_product ?? undefined,
    retrospective: item.retrospective ?? undefined,
  }),

  sprintEntry: (item: SupabaseSprintEntry): SprintEntry => ({
    id: item.id,
    sprintId: item.sprint_id,
    projectId: item.project_id,
    collaboratorId: item.collaborator_id ?? undefined,
    title: item.title,
    status: item.status,
    plannedHours: item.planned_hours ?? undefined,
    spentHours: item.spent_hours ?? undefined,
    reason: item.reason ?? undefined,
    createdAt: item.created_at ? new Date(item.created_at) : undefined,
    updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
  }),
};

// Realtime: garante inicialização única
let realtimeInitialized = false;
const setupRealtime = (get: () => AppState & AppActions, set: (fn: any) => void) => {
  if (realtimeInitialized) return;
  try {
    const channel = supabase.channel('caaqui-db-changes');

    const onChange = (payload: any, table: 'projects' | 'project_allocations' | 'board_activities' | 'rituals' | 'collaborators') => {
      try { console.log('[RT]', table, payload.eventType, payload.new?.id || payload.old?.id); } catch {}
      const event = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const newRow = payload.new as any;
      const oldRow = payload.old as any;

      if (table === 'projects') {
        if (event === 'INSERT') {
          const proj = convertFromSupabase.project(newRow);
          set((state: any) => {
            const exists = state.projects.some((p: any) => p.id === proj.id);
            return {
              projects: exists
                ? state.projects.map((p: any) => p.id === proj.id ? { ...p, ...proj } : p)
                : [...state.projects, proj],
            };
          });
        } else if (event === 'UPDATE') {
          const proj = convertFromSupabase.project(newRow);
          set((state: any) => ({ projects: state.projects.map((p: any) => p.id === proj.id ? { ...p, ...proj } : p) }));
        } else if (event === 'DELETE') {
          const id = oldRow?.id;
          if (id) set((state: any) => ({ projects: state.projects.filter((p: any) => p.id !== id) }));
        }
      }

      if (table === 'project_allocations') {
        if (event === 'INSERT') {
          const alloc = convertFromSupabase.projectAllocation(newRow);
          set((state: any) => {
            const exists = state.projectAllocations.some((a: any) => a.id === alloc.id);
            return {
              projectAllocations: exists
                ? state.projectAllocations.map((a: any) => a.id === alloc.id ? { ...a, ...alloc } : a)
                : [...state.projectAllocations, alloc],
            };
          });
        } else if (event === 'UPDATE') {
          const alloc = convertFromSupabase.projectAllocation(newRow);
          set((state: any) => ({ projectAllocations: state.projectAllocations.map((a: any) => a.id === alloc.id ? { ...a, ...alloc } : a) }));
        } else if (event === 'DELETE') {
          const id = oldRow?.id;
          if (id) set((state: any) => ({ projectAllocations: state.projectAllocations.filter((a: any) => a.id !== id) }));
        }
      }

      if (table === 'board_activities') {
        if (event === 'INSERT') {
          const act = convertFromSupabase.boardActivity(newRow);
          set((state: any) => {
            const exists = state.boardActivities.some((b: any) => b.id === act.id);
            return {
              boardActivities: exists
                ? state.boardActivities.map((b: any) => b.id === act.id ? { ...b, ...act } : b)
                : [...state.boardActivities, act],
            };
          });
        } else if (event === 'UPDATE') {
          const act = convertFromSupabase.boardActivity(newRow);
          set((state: any) => ({ boardActivities: state.boardActivities.map((b: any) => b.id === act.id ? { ...b, ...act } : b) }));
        } else if (event === 'DELETE') {
          const id = oldRow?.id;
          if (id) set((state: any) => ({ boardActivities: state.boardActivities.filter((b: any) => b.id !== id) }));
        }
      }

      if (table === 'rituals') {
        if (event === 'INSERT') {
          const r = convertFromSupabase.ritual(newRow);
          set((state: any) => {
            const exists = state.rituals.some((x: any) => x.id === r.id);
            return {
              rituals: exists
                ? state.rituals.map((x: any) => x.id === r.id ? { ...x, ...r } : x)
                : [...state.rituals, r],
            };
          });
        } else if (event === 'UPDATE') {
          const r = convertFromSupabase.ritual(newRow);
          set((state: any) => ({ rituals: state.rituals.map((x: any) => x.id === r.id ? { ...x, ...r } : x) }));
        } else if (event === 'DELETE') {
          const id = oldRow?.id;
          if (id) set((state: any) => ({ rituals: state.rituals.filter((x: any) => x.id !== id) }));
        }
      }

      if (table === 'collaborators') {
        if (event === 'INSERT') {
          const c = convertFromSupabase.collaborator(newRow);
          set((state: any) => {
            const exists = state.collaborators.some((x: any) => x.id === c.id);
            return {
              collaborators: exists
                ? state.collaborators.map((x: any) => x.id === c.id ? { ...x, ...c } : x)
                : [...state.collaborators, c],
            };
          });
        } else if (event === 'UPDATE') {
          const c = convertFromSupabase.collaborator(newRow);
          set((state: any) => ({ collaborators: state.collaborators.map((x: any) => x.id === c.id ? { ...x, ...c } : x) }));
        } else if (event === 'DELETE') {
          const id = oldRow?.id;
          if (id) set((state: any) => ({ collaborators: state.collaborators.filter((x: any) => x.id !== id) }));
        }
      }
    };

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (p) => onChange(p, 'projects'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_allocations' }, (p) => onChange(p, 'project_allocations'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_activities' }, (p) => onChange(p, 'board_activities'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rituals' }, (p) => onChange(p, 'rituals'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborators' }, (p) => onChange(p, 'collaborators'))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('🔔 Realtime conectado');
          // Hidrata imediatamente dados críticos para colaboração
          try {
            const [freshCols, freshAlloc] = await Promise.all([
              collaboratorsAPI.getAll().catch(() => []),
              projectAllocationsAPI.getAll().catch(() => []),
            ]);
            set((state: any) => ({
              collaborators: Array.isArray(freshCols) && freshCols.length > 0 ? freshCols.map(convertFromSupabase.collaborator) : state.collaborators,
              projectAllocations: Array.isArray(freshAlloc) && freshAlloc.length > 0 ? freshAlloc.map(convertFromSupabase.projectAllocation) : state.projectAllocations,
            }));

            // Polling curto para abas que abriram vazias: 5s x 6
            let attempts = 0;
            const poll = async () => {
              attempts++;
              const state = get();
              const needCols = (state.collaborators?.length || 0) === 0;
              const needAlloc = (state.projectAllocations?.length || 0) === 0;
              if (!needCols && !needAlloc) return; // já temos dados
              try {
                const [pCols, pAlloc] = await Promise.all([
                  needCols ? collaboratorsAPI.getAll().catch(() => []) : Promise.resolve([]),
                  needAlloc ? projectAllocationsAPI.getAll().catch(() => []) : Promise.resolve([]),
                ]);
                if ((pCols as any[])?.length > 0 || (pAlloc as any[])?.length > 0) {
                  set((s: any) => ({
                    collaborators: (pCols as any[])?.length > 0 ? (pCols as any[]).map(convertFromSupabase.collaborator) : s.collaborators,
                    projectAllocations: (pAlloc as any[])?.length > 0 ? (pAlloc as any[]).map(convertFromSupabase.projectAllocation) : s.projectAllocations,
                  }));
                  return; // encerra polling após hidratar
                }
              } catch {}
              if (attempts < 6) setTimeout(poll, 5000);
            };
            setTimeout(poll, 5000);
          } catch (e) {
            console.warn('⚠️ Falha ao hidratar após SUBSCRIBED:', e);
          }
        }
      });

    realtimeInitialized = true;
  } catch (e) {
    console.warn('⚠️ Falha ao iniciar Realtime:', e);
  }
};

const convertToSupabase = {
  boardActivity: (item: Partial<BoardActivity>): Partial<SupabaseBoardActivity> => ({
    title: item.title,
    status: item.status,
    assignee_id: item.assigneeId,
    description: item.description,
    client: item.client,
    points: item.points,
    subtasks: item.subtasks,
    project_id: item.projectId,
    due_date: item.dueDate?.toISOString(),
  }),

  collaborator: (item: Partial<Collaborator>): Partial<SupabaseCollaborator> => ({
    // Somente colunas existentes na tabela collaborators
    id: item.id as any,
    name: item.name,
    email: item.email,
    role: item.role,
    avatar: item.avatar,
  }),

  okr: (item: Partial<OKR>): Partial<SupabaseOKR> => ({
    title: item.title,
    description: item.description,
    progress: item.progress,
    activities: item.activities,
  }),

  ritual: (item: Partial<Ritual>): Partial<SupabaseRitual> => ({
    title: item.title,
    content: item.content,
    frequency: item.frequency,
    next_date: item.nextDate?.toISOString(),
    project_id: item.projectId as any,
  }),

  project: (item: Partial<Project>): Partial<SupabaseProject> => ({
    name: item.name,
    client: item.client,
    type: item.type === 'tech' ? 'tech_implementation' : 'growth_agency',
    status: item.status === 'archived' ? 'cancelled' : item.status,
    start_date: item.startDate?.toISOString(),
    end_date: item.endDate?.toISOString(),
    description: item.description,
    budget: item.budget,
    tech_details: item.techDetails,
    growth_details: item.growthDetails,
  }),

  projectAllocation: (item: Partial<ProjectAllocation>): Partial<SupabaseProjectAllocation> => ({
    project_id: item.projectId,
    collaborator_id: item.collaboratorId,
    percentage: item.percentage,
    role: item.role,
    hour_type: item.hourType,
    planned_hours_monthly: item.plannedHoursMonthly,
    start_date: item.startDate?.toISOString(),
    end_date: item.endDate?.toISOString(),
  }),

  sprint: (item: Partial<Sprint>): Partial<SupabaseSprint> => ({
    project_id: item.projectId,
    number: item.number,
    name: item.name,
    start_date: item.startDate?.toISOString(),
    end_date: item.endDate?.toISOString(),
    objective: item.objective,
    status: item.status,
    planned_hours_billable: item.plannedHoursBillable,
    planned_hours_non_billable: item.plannedHoursNonBillable,
    planned_hours_product: item.plannedHoursProduct,
    retrospective: item.retrospective,
  }),

  sprintEntry: (item: Partial<SprintEntry>): Partial<SupabaseSprintEntry> => ({
    sprint_id: item.sprintId,
    project_id: item.projectId,
    collaborator_id: item.collaboratorId,
    title: item.title,
    status: item.status,
    planned_hours: item.plannedHours,
    spent_hours: item.spentHours,
    reason: item.reason,
  }),
};

interface AppState {
  boardActivities: BoardActivity[];
  collaborators: Collaborator[];
  okrs: OKR[];
  rituals: Ritual[];
  projects: Project[];
  projectAllocations: ProjectAllocation[];
  sprints: Sprint[];
  sprintEntries: SprintEntry[];
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
  duplicateBoardActivity: (id: string) => Promise<void>;
  
  // Collaborators
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<void>;
  updateCollaborator: (id: string, patch: Partial<Collaborator>) => Promise<void>;
  deleteCollaborator: (id: string) => Promise<void>;
  // Debug/utility
  setCollaborators: (list: Collaborator[]) => void;
  
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
  archiveProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  permanentlyDeleteProject: (id: string) => Promise<void>;
  cleanupArchivedProjects: () => Promise<void>;
  duplicateProject: (id: string, newName?: string) => Promise<void>;
  createProjectFromTemplate: (templateId: string, projectName: string, client: string) => Promise<void>;
  
  // Project Allocations
  addProjectAllocation: (allocation: Omit<ProjectAllocation, 'id'>) => Promise<void>;
  updateProjectAllocation: (id: string, patch: Partial<ProjectAllocation>) => Promise<void>;
  deleteProjectAllocation: (id: string) => Promise<void>;
  
  // Sprints
  addSprint: (sprint: Omit<Sprint, 'id'>) => Promise<void>;
  updateSprint: (id: string, patch: Partial<Sprint>) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;

  // Sprint Entries
  addSprintEntry: (entry: Omit<SprintEntry, 'id'>) => Promise<void>;
  updateSprintEntry: (id: string, patch: Partial<SprintEntry>) => Promise<void>;
  deleteSprintEntry: (id: string) => Promise<void>;
  
  // Utility functions
  getTeamAvailability: () => TeamAvailability[];
  getProjectMetrics: () => ProjectMetrics[];
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// Hidratar colaboradores do localStorage logo no início (sincrono)
const initialCollaborators: Collaborator[] = (() => {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('caaqui_collaborators');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const data = Array.isArray(parsed?.data) ? parsed.data : (Array.isArray(parsed) ? parsed : []);
    return (data || []) as Collaborator[];
  } catch {
    return [];
  }
})();

export const useAppStore = create<AppState & AppActions>()((set, get) => ({
  // Estado inicial
  boardActivities: [],
  collaborators: initialCollaborators,
  okrs: [],
  rituals: [],
  projects: [],
  projectAllocations: [],
  sprints: [],
  sprintEntries: [],
  isLoading: false,
  error: null,

  // Loading & Error
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setCollaborators: (list) => set({ collaborators: list }),

  // Initialize data from Supabase
  loadAllData: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const connectionOk = await testConnection().catch(() => false);
      if (!connectionOk) {
        console.warn('⚠️ Supabase indisponível. Carregando dados do localStorage/fallback.');
        // Inicializa dados de fallback somente quando o Supabase não está disponível
        if (typeof window !== 'undefined') {
          const { initializeFallbackData } = await import('./init-fallback-data');
          initializeFallbackData();
        }
      }

      const [boardActivities, collaborators, okrs, rituals, projects, projectAllocations] = await Promise.all([
        boardActivitiesAPI.getAll().catch(err => {
          console.warn('Aviso ao carregar boardActivities:', err);
          return [];
        }),
        collaboratorsAPI.getAll().catch(err => {
          console.warn('Aviso ao carregar collaborators:', err);
          return [];
        }),
        okrsAPI.getAll().catch(err => {
          console.warn('Aviso ao carregar okrs:', err);
          return [];
        }),
        ritualsAPI.getAll().catch(err => {
          console.warn('Aviso ao carregar rituals:', err);
          return [];
        }),
        projectsAPI.getAll().catch(err => {
          console.warn('Aviso ao carregar projects:', err);
          return [];
        }),
        projectAllocationsAPI.getAll().catch(err => {
          console.warn('Aviso ao carregar project_allocations:', err);
          return [];
        }),
      ]);

      // Se collaborators, projects, projectAllocations ou boardActivities estão vazios, tenta carregar do localStorage
      let finalProjects = projects;
      let finalProjectAllocations = projectAllocations;
      let finalBoardActivities = boardActivities;
      let finalCollaborators = collaborators;

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
          finalBoardActivities = loadFromStorage(STORAGE_KEYS.BOARD_ACTIVITIES);
          if (finalBoardActivities.length > 0) {
            console.log('📦 Carregando board_activities do localStorage:', finalBoardActivities.length);
          }
        } catch (err) {
          console.warn('Erro ao carregar board_activities do localStorage:', err);
        }
      }

      if (collaborators.length === 0) {
        try {
          const localCollaborators = loadFromStorage(STORAGE_KEYS.COLLABORATORS);
          if (localCollaborators.length > 0) {
            // Se vierem no formato local, apenas usa; se vierem no formato do Supabase, converte
            const hasLocalShape = !!(localCollaborators[0] as any)?.accessLevel || !!(localCollaborators[0] as any)?.position;
            finalCollaborators = hasLocalShape
              ? (localCollaborators as any)
              : (localCollaborators as any).map(convertFromSupabase.collaborator);
            console.log('📦 Carregando collaborators do localStorage:', finalCollaborators.length);
          }
        } catch (err) {
          console.warn('Erro ao carregar collaborators do localStorage:', err);
        }
      }

      const existingCols = get().collaborators || [];
      const loadedCols = finalCollaborators.length > 0
        ? ((finalCollaborators[0] as any)?.accessLevel || (finalCollaborators[0] as any)?.position
            ? finalCollaborators as any
            : finalCollaborators.map(convertFromSupabase.collaborator))
        : [];

      // Merge seguro: prioriza dados vindos do Supabase quando existem, mantendo locais
      const mergeCollaborators = () => {
        const byKey = new Map<string, any>();
        const keyFor = (c: any) => c.id || c.email || `${c.name}:${c.position || ''}`;
        // 1) existentes no estado (otimistas)
        for (const c of existingCols) byKey.set(keyFor(c), c);
        // 2) locais
        for (const c of loadedCols) byKey.set(keyFor(c), { ...(byKey.get(keyFor(c)) || {}), ...c });
        return Array.from(byKey.values());
      };

      const mergedCollaborators = mergeCollaborators();

      // Persistir imediatamente no localStorage para garantir sobrevivência a reload
      try {
        saveToStorage(STORAGE_KEYS.COLLABORATORS, mergedCollaborators);
      } catch {}

      set({
        boardActivities: finalBoardActivities.length > 0 ? (finalBoardActivities[0]?.id ? finalBoardActivities.map(convertFromSupabase.boardActivity) : finalBoardActivities) : [],
        collaborators: mergedCollaborators,
        okrs: okrs.map(convertFromSupabase.okr),
        rituals: rituals.map(convertFromSupabase.ritual),
        projects: finalProjects.length > 0 ? (finalProjects[0]?.id ? finalProjects.map(convertFromSupabase.project) : finalProjects) : [],
        projectAllocations: finalProjectAllocations.length > 0 ? (finalProjectAllocations[0]?.id ? finalProjectAllocations.map(convertFromSupabase.projectAllocation) : finalProjectAllocations) : [],
        isLoading: false,
      });

      // Executar verificações de notificação após carregar dados
      const currentState = get();
      notificationService.runChecks(
        currentState.projects,
        currentState.collaborators,
        currentState.projectAllocations
      );

      // Inicia Realtime mesmo que o teste de SELECT falhe (pode haver política de SELECT mais restrita)
      setupRealtime(get, set as any);

      // Salvaguarda: se ainda ficou vazio (ex: Supabase vazio e sem merge), tenta localStorage cru
      if (mergedCollaborators.length === 0) {
        try {
          const raw = localStorage.getItem('caaqui_collaborators');
          if (raw) {
            const parsed = JSON.parse(raw);
            const data = Array.isArray(parsed?.data) ? parsed.data : Array.isArray(parsed) ? parsed : [];
            if (data.length > 0) {
              set({ collaborators: data });
              saveToStorage(STORAGE_KEYS.COLLABORATORS, data);
            }
          }
        } catch {}
      }
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
        
        // Fallback: salva no localStorage com sistema melhorado
        const localActivities = loadFromStorage(STORAGE_KEYS.BOARD_ACTIVITIES);
        localActivities.push(activity);
        saveToStorage(STORAGE_KEYS.BOARD_ACTIVITIES, localActivities);
        
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
        
        // Atualiza localStorage com sistema melhorado
        const localActivities = loadFromStorage(STORAGE_KEYS.BOARD_ACTIVITIES);
        const updatedLocalActivities = localActivities.map((a: any) => 
          a.id === id ? { ...a, ...convertToSupabase.boardActivity(updatedActivity) } : a
        );
        saveToStorage(STORAGE_KEYS.BOARD_ACTIVITIES, updatedLocalActivities);
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
        
        // Fallback: remove do localStorage com sistema melhorado
        const localActivities = loadFromStorage(STORAGE_KEYS.BOARD_ACTIVITIES);
        const filteredActivities = localActivities.filter((a: any) => a.id !== id);
        saveToStorage(STORAGE_KEYS.BOARD_ACTIVITIES, filteredActivities);
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
      // Otimista: adiciona no estado imediatamente para refletir na UI
      set((state) => ({
        collaborators: [...state.collaborators, newCollaborator]
      }));
      console.log('👥 [addCollaborator] Otimista ->', newCollaborator);
      // Também persiste imediatamente no localStorage para evitar "race" com loadAllData
      try {
        const currentImmediate = loadFromStorage(STORAGE_KEYS.COLLABORATORS) as any[];
        currentImmediate.push(newCollaborator);
        saveToStorage(STORAGE_KEYS.COLLABORATORS, currentImmediate);
      } catch {}
      try {
        const toSupabase = convertToSupabase.collaborator(newCollaborator);
        const created = await collaboratorsAPI.create(toSupabase as any);
        const converted = convertFromSupabase.collaborator(created);
        set((state) => ({
          collaborators: state.collaborators.map(c => c.id === newCollaborator.id ? { ...c, ...converted } : c)
        }));
        console.log('👥 [addCollaborator] Persistido no Supabase, convertido ->', converted);
        // Persiste estado atualizado no localStorage
        try {
          const current = get().collaborators;
          saveToStorage(STORAGE_KEYS.COLLABORATORS, current);
        } catch {}
      } catch (e) {
        console.warn('⚠️ Erro ao criar colaborador no Supabase, usando localStorage');
        // Fallback: salvar no localStorage e atualizar estado imediatamente
        const current = loadFromStorage(STORAGE_KEYS.COLLABORATORS) as any[];
        current.push(newCollaborator);
        saveToStorage(STORAGE_KEYS.COLLABORATORS, current);
        console.log('💾 [addCollaborator] Salvo no localStorage. Total local ->', current.length);
      }
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
      set({ error: 'Erro ao adicionar colaborador' });
    }
  },

  updateCollaborator: async (id, patch) => {
    try {
      try {
        const supabasePatch = convertToSupabase.collaborator(patch);
        const updated = await collaboratorsAPI.update(id, supabasePatch);
        const converted = convertFromSupabase.collaborator(updated);
        set((state) => ({
          collaborators: state.collaborators.map(c => 
            c.id === id ? { ...c, ...converted } : c
          )
        }));
        // Persistir também no localStorage em caso de sucesso remoto
        try {
          const current = get().collaborators;
          saveToStorage(STORAGE_KEYS.COLLABORATORS, current);
        } catch {}
      } catch (e) {
        console.warn('⚠️ Erro ao atualizar colaborador no Supabase, usando localStorage');
        const updatedLocal = { ...patch, id } as any;
        set((state) => ({
          collaborators: state.collaborators.map(c => c.id === id ? { ...c, ...updatedLocal } : c)
        }));
        // Persistir no localStorage
        const current = loadFromStorage(STORAGE_KEYS.COLLABORATORS) as any[];
        const next = current.length > 0 ? current.map((c:any) => c.id === id ? { ...c, ...updatedLocal } : c) : [];
        if (next.length > 0) saveToStorage(STORAGE_KEYS.COLLABORATORS, next);
      }
    } catch (error) {
      console.error('Erro ao atualizar colaborador:', error);
      set({ error: 'Erro ao atualizar colaborador' });
    }
  },

  deleteCollaborator: async (id) => {
    try {
      try {
        await collaboratorsAPI.delete(id);
      } catch (e) {
        console.warn('⚠️ Erro ao deletar colaborador no Supabase, usando localStorage');
        const current = loadFromStorage(STORAGE_KEYS.COLLABORATORS) as any[];
        const next = current.filter((c:any) => c.id !== id);
        if (current.length !== next.length) saveToStorage(STORAGE_KEYS.COLLABORATORS, next);
      }
      set((state) => ({
        collaborators: state.collaborators.filter(c => c.id !== id)
      }));
      // Atualiza localStorage também após sucesso
      try {
        const current = get().collaborators;
        saveToStorage(STORAGE_KEYS.COLLABORATORS, current);
      } catch {}
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
      // 1) Remover alocações relacionadas (Supabase + local)
      try {
        const related = (await projectAllocationsAPI.getByProject(id)).map((a: any) => a.id);
        for (const allocId of related) {
          try { await projectAllocationsAPI.delete(allocId); } catch {}
        }
      } catch {
        // Fallback local
        const localAllocs = JSON.parse(localStorage.getItem('caaqui_project_allocations') || '[]');
        const filtered = localAllocs.filter((a: { project_id?: string; projectId?: string }) => (a.project_id || a.projectId) !== id);
        localStorage.setItem('caaqui_project_allocations', JSON.stringify(filtered));
      }

      // 2) Remover cards (board_activities) vinculados ao projeto no Supabase/local
      try {
        const current = get().boardActivities;
        const toDelete = current.filter(b => b.projectId === id);
        for (const b of toDelete) {
          try { await boardActivitiesAPI.delete(b.id); } catch {}
        }
        set((state) => ({
          boardActivities: state.boardActivities.filter(b => b.projectId !== id)
        }));
      } catch {}

      // 3) Remover o projeto em si (Supabase + local)
      try {
        await projectsAPI.delete(id);
      } catch {
        console.warn('⚠️ Erro ao deletar no Supabase, usando localStorage');
        const localProjects = JSON.parse(localStorage.getItem('caaqui_projects') || '[]');
        const filteredProjects = localProjects.filter((p: { id: string }) => p.id !== id);
        localStorage.setItem('caaqui_projects', JSON.stringify(filteredProjects));
      }

      // 4) Remover do estado local: projeto e alocações relacionadas
      set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        projectAllocations: state.projectAllocations.filter(a => a.projectId !== id),
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

  // Sprints
  addSprint: async (sprint) => {
    try {
      const localSprint: Sprint = {
        id: uid(),
        ...sprint,
      };

      // Otimista: adiciona no estado
      set((state) => ({ sprints: [...state.sprints, localSprint] }));

      try {
        const toSupabase = convertToSupabase.sprint(localSprint) as Omit<SupabaseSprint, 'created_at' | 'updated_at'>;
        const created = await sprintsAPI.create(toSupabase);
        const converted = convertFromSupabase.sprint(created);
        set((state) => ({
          sprints: state.sprints.map(s => s.id === localSprint.id ? converted : s),
        }));
      } catch (err) {
        console.warn('⚠️ Erro ao criar sprint no Supabase, mantendo apenas no estado local', err);
      }
    } catch (error) {
      console.error('Erro ao adicionar sprint:', error);
      set({ error: 'Erro ao adicionar sprint' });
    }
  },

  updateSprint: async (id, patch) => {
    try {
      try {
        const toSupabase = convertToSupabase.sprint(patch);
        const updated = await sprintsAPI.update(id, toSupabase as Partial<SupabaseSprint>);
        const converted = convertFromSupabase.sprint(updated);
        set((state) => ({
          sprints: state.sprints.map(s => s.id === id ? { ...s, ...converted } : s),
        }));
      } catch (err) {
        console.warn('⚠️ Erro ao atualizar sprint no Supabase, atualizando apenas localmente', err);
        set((state) => ({
          sprints: state.sprints.map(s => s.id === id ? { ...s, ...patch } : s),
        }));
      }
    } catch (error) {
      console.error('Erro ao atualizar sprint:', error);
      set({ error: 'Erro ao atualizar sprint' });
    }
  },

  deleteSprint: async (id) => {
    try {
      try {
        await sprintsAPI.delete(id);
      } catch (err) {
        console.warn('⚠️ Erro ao deletar sprint no Supabase, removendo apenas localmente', err);
      }

      set((state) => ({
        sprints: state.sprints.filter(s => s.id !== id),
        sprintEntries: state.sprintEntries.filter(e => e.sprintId !== id),
      }));
    } catch (error) {
      console.error('Erro ao deletar sprint:', error);
      set({ error: 'Erro ao deletar sprint' });
    }
  },

  // Sprint Entries
  addSprintEntry: async (entry) => {
    try {
      const localEntry: SprintEntry = {
        id: uid(),
        ...entry,
      };

      set((state) => ({ sprintEntries: [...state.sprintEntries, localEntry] }));

      try {
        const toSupabase = convertToSupabase.sprintEntry(localEntry) as Omit<SupabaseSprintEntry, 'created_at' | 'updated_at'>;
        const created = await sprintEntriesAPI.create(toSupabase);
        const converted = convertFromSupabase.sprintEntry(created);
        set((state) => ({
          sprintEntries: state.sprintEntries.map(e => e.id === localEntry.id ? converted : e),
        }));
      } catch (err) {
        console.warn('⚠️ Erro ao criar sprint entry no Supabase, mantendo apenas no estado local', err);
      }
    } catch (error) {
      console.error('Erro ao adicionar sprint entry:', error);
      set({ error: 'Erro ao adicionar sprint entry' });
    }
  },

  updateSprintEntry: async (id, patch) => {
    try {
      try {
        const toSupabase = convertToSupabase.sprintEntry(patch);
        const updated = await sprintEntriesAPI.update(id, toSupabase as Partial<SupabaseSprintEntry>);
        const converted = convertFromSupabase.sprintEntry(updated);
        set((state) => ({
          sprintEntries: state.sprintEntries.map(e => e.id === id ? { ...e, ...converted } : e),
        }));
      } catch (err) {
        console.warn('⚠️ Erro ao atualizar sprint entry no Supabase, atualizando apenas localmente', err);
        set((state) => ({
          sprintEntries: state.sprintEntries.map(e => e.id === id ? { ...e, ...patch } : e),
        }));
      }
    } catch (error) {
      console.error('Erro ao atualizar sprint entry:', error);
      set({ error: 'Erro ao atualizar sprint entry' });
    }
  },

  deleteSprintEntry: async (id) => {
    try {
      try {
        await sprintEntriesAPI.delete(id);
      } catch (err) {
        console.warn('⚠️ Erro ao deletar sprint entry no Supabase, removendo apenas localmente', err);
      }

      set((state) => ({
        sprintEntries: state.sprintEntries.filter(e => e.id !== id),
      }));
    } catch (error) {
      console.error('Erro ao deletar sprint entry:', error);
      set({ error: 'Erro ao deletar sprint entry' });
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
        const project = state.projects.find(p => p.id === a.projectId);
        const notArchived = project && project.status !== 'archived' && project.status !== 'cancelled';
        const isActiveByDate = new Date(a.endDate) > now;
        return Boolean(project) && notArchived && isActiveByDate;
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
    const { projects, projectAllocations, collaborators } = get();
    
    return projects.map(project => {
      const allocations = projectAllocations.filter(a => a.projectId === project.id);
      const totalAllocation = allocations.reduce((sum, a) => sum + a.percentage, 0);
      
      // Calcular custo real baseado no valor/hora dos colaboradores
      const realCost = allocations.reduce((sum, allocation) => {
        const collaborator = collaborators.find(c => c.id === allocation.collaboratorId);
        if (!collaborator?.hourlyRate) return sum;
        
        // Calcular duração da alocação em semanas
        const startDate = new Date(allocation.startDate);
        const endDate = new Date(allocation.endDate);
        const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        
        // Calcular horas totais (assumindo 40h/semana como 100% de alocação)
        const hoursPerWeek = (allocation.percentage / 100) * 40;
        const totalHours = hoursPerWeek * weeks;
        
        return sum + (totalHours * collaborator.hourlyRate);
      }, 0);
      
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      const now = new Date();
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const progressPct = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
      const isOnTime = daysRemaining >= 0 && progressPct <= 100;
      
      return {
        id: project.id,
        name: project.name,
        status: project.status,
        progressPct,
        daysRemaining,
        isOnTime,
        totalAllocation,
        realCost,
        budgetVariance: project.budget ? ((realCost - project.budget) / project.budget) * 100 : 0
      };
    });
  },

  // Funções de arquivamento de projetos
  archiveProject: async (id: string) => {
    try {
      const archivedAt = new Date();
      await get().updateProject(id, { 
        status: 'archived', 
        archivedAt 
      });
    } catch (error) {
      console.error('Erro ao arquivar projeto:', error);
      set({ error: 'Erro ao arquivar projeto' });
    }
  },

  restoreProject: async (id: string) => {
    try {
      await get().updateProject(id, { 
        status: 'active', 
        archivedAt: undefined 
      });
    } catch (error) {
      console.error('Erro ao restaurar projeto:', error);
      set({ error: 'Erro ao restaurar projeto' });
    }
  },

  permanentlyDeleteProject: async (id: string) => {
    try {
      await get().deleteProject(id);
    } catch (error) {
      console.error('Erro ao excluir projeto permanentemente:', error);
      set({ error: 'Erro ao excluir projeto permanentemente' });
    }
  },

  cleanupArchivedProjects: async () => {
    try {
      const { projects } = get();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const projectsToDelete = projects.filter(p => 
        p.status === 'archived' && 
        p.archivedAt && 
        p.archivedAt < thirtyDaysAgo
      );

      for (const project of projectsToDelete) {
        await get().permanentlyDeleteProject(project.id);
      }

      console.log(`Limpeza automática: ${projectsToDelete.length} projetos removidos`);
    } catch (error) {
      console.error('Erro na limpeza de projetos arquivados:', error);
    }
  },

  duplicateProject: async (id: string, newName?: string) => {
    try {
      const { projects, projectAllocations } = get();
      const originalProject = projects.find(p => p.id === id);
      
      if (!originalProject) {
        throw new Error('Projeto não encontrado');
      }

      // Criar cópia do projeto
      const duplicatedProject: Omit<Project, 'id' | 'allocations'> = {
        name: newName || `${originalProject.name} (Cópia)`,
        client: originalProject.client,
        type: originalProject.type,
        status: 'planning',
        startDate: new Date(),
        endDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 dias a partir de hoje
        description: originalProject.description,
        budget: originalProject.budget,
        techDetails: originalProject.techDetails,
        growthDetails: originalProject.growthDetails,
      };

      // Adicionar projeto duplicado
      await get().addProject(duplicatedProject);

      // Buscar o projeto recém-criado para obter o ID
      const { projects: updatedProjects } = get();
      const newProject = updatedProjects.find(p => p.name === duplicatedProject.name);
      
      if (newProject) {
        // Duplicar alocações do projeto original
        const originalAllocations = projectAllocations.filter(a => a.projectId === id);
        
        for (const allocation of originalAllocations) {
          const duplicatedAllocation: Omit<ProjectAllocation, 'id'> = {
            projectId: newProject.id,
            collaboratorId: allocation.collaboratorId,
            percentage: allocation.percentage,
            role: allocation.role,
            hourType: allocation.hourType ?? 'billable',
            plannedHoursMonthly: allocation.plannedHoursMonthly,
            startDate: duplicatedProject.startDate,
            endDate: duplicatedProject.endDate,
          };
          
          await get().addProjectAllocation(duplicatedAllocation);
        }
      }

      console.log('Projeto duplicado com sucesso');
    } catch (error) {
      console.error('Erro ao duplicar projeto:', error);
      set({ error: 'Erro ao duplicar projeto' });
    }
  },

  createProjectFromTemplate: async (templateId: string, projectName: string, client: string) => {
    try {
      const { getTemplateById, createProjectFromTemplate } = await import('./project-templates');
      const template = getTemplateById(templateId);
      
      if (!template) {
        throw new Error('Template não encontrado');
      }

      const { project, tasks } = createProjectFromTemplate(template, projectName, client);
      
      // Criar o projeto
      await get().addProject(project);
      
      // Buscar o projeto recém-criado para obter o ID
      const { projects } = get();
      const newProject = projects.find(p => p.name === projectName);
      
      if (newProject) {
        // Criar as tarefas do template
        for (const task of tasks) {
          await get().addBoardActivity(task.title, {
            ...task,
            projectId: newProject.id,
          });
        }
      }

      console.log('Projeto criado a partir do template com sucesso');
    } catch (error) {
      console.error('Erro ao criar projeto a partir do template:', error);
      set({ error: 'Erro ao criar projeto a partir do template' });
    }
  },

  duplicateBoardActivity: async (id: string) => {
    try {
      const { boardActivities } = get();
      const originalActivity = boardActivities.find(a => a.id === id);
      
      if (!originalActivity) {
        throw new Error('Atividade não encontrada');
      }

      // Criar cópia da atividade
      const duplicatedActivity = {
        title: `${originalActivity.title} (Cópia)`,
        status: 'backlog' as const,
        assigneeId: originalActivity.assigneeId,
        description: originalActivity.description,
        client: originalActivity.client,
        projectId: originalActivity.projectId,
        subtasks: originalActivity.subtasks ? [...originalActivity.subtasks] : undefined,
      };

      await get().addBoardActivity(duplicatedActivity.title, duplicatedActivity);
      console.log('Card duplicado com sucesso');
    } catch (error) {
      console.error('Erro ao duplicar card:', error);
      set({ error: 'Erro ao duplicar card' });
    }
  },
}));
