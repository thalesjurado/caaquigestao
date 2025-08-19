'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ID = string;

export type Collaborator = {
  id: ID;
  name: string;
  role?: string;
  email?: string;
  capacity?: number; // pts/semana
};

export type BoardStatus = 'backlog' | 'todo' | 'doing' | 'review' | 'done';

export type BoardActivity = {
  id: ID;
  title: string;
  status: BoardStatus;
  points?: number;
  assigneeId?: ID;
  client?: string;
  project?: string;
  pillar?: string;
  due?: string; // yyyy-mm-dd
};

export type OKRActivity = {
  id: ID;
  title: string;
  assigneeId?: ID;
};

export type OKR = {
  id: ID;
  title: string;
  activities: OKRActivity[];
};

export type Ritual = {
  id: ID;
  title: string;
  owner?: string;
  when?: string;   // ex: "Segunda — 10:00"
  notes?: string;
};

export type ProjectHealth = 'Saudável' | 'Atenção';

export type Project = {
  id: ID;
  client: string;
  name: string;
  pillar: string;
  ownerId?: ID;
  start: string; // yyyy-mm-dd
  end: string;   // yyyy-mm-dd
  health: ProjectHealth;
};

type Store = {
  // Entities
  collaborators: Collaborator[];
  boardActivities: BoardActivity[];
  okrs: OKR[];
  rituals: Ritual[];
  projects: Project[];

  // Collaborators
  addCollaborator: (name: string, role?: string, email?: string) => void;
  updateCollaborator: (id: ID, patch: Partial<Collaborator>) => void;
  deleteCollaborator: (id: ID) => void;

  // Board
  addBoardActivity: (title: string, extra?: Partial<BoardActivity>) => void;
  setBoardStatus: (id: ID, status: BoardStatus) => void;
  setBoardAssignee: (id: ID, assigneeId?: ID) => void;
  deleteBoardActivity: (id: ID) => void;

  // OKRs
  addOKR: (title: string) => void;
  deleteOKR: (id: ID) => void;
  addOKRActivity: (okrId: ID, title: string) => void;
  deleteOKRActivity: (okrId: ID, actId: ID) => void;
  setActivityAssignee: (okrId: ID, actId: ID, assigneeId?: ID) => void;

  // Rituals
  addRitual: (title: string, extra?: Partial<Ritual>) => void;
  updateRitual: (id: ID, patch: Partial<Ritual>) => void;
  deleteRitual: (id: ID) => void;

  // Projects
  addProject: (p: Omit<Project, 'id'>) => void;
  updateProject: (id: ID, patch: Partial<Project>) => void;
  deleteProject: (id: ID) => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const seed = () => {
  // Colaboradores (com capacidades para a tela Equipe)
  const cols: Collaborator[] = [
    { id: 'c-thales', name: 'Thales', role: 'Vendas/Strategy', capacity: 15 },
    { id: 'c-marlon', name: 'Marlon', role: 'CSM', capacity: 25 },
    { id: 'c-davi', name: 'Davi', role: 'Finance/Vendas', capacity: 10 },
    { id: 'c-thiago', name: 'Thiago Gomes', role: 'Head Tech', capacity: 30 },
    { id: 'c-tati', name: 'Tati', role: 'CSM', capacity: 25 },
    { id: 'c-thais', name: 'Thais', role: 'App Growth', capacity: 25 },
    { id: 'c-paula', name: 'Paula', role: 'App Growth', capacity: 25 },
    { id: 'c-larissa', name: 'Larissa', role: 'CRM', capacity: 30 },
  ];

  // Projetos (tabela Projetos)
  const projects: Project[] = [
    {
      id: 'p-webc',
      client: 'Webcontinental',
      name: 'Re-implementação Insider + CRM Ops',
      pillar: 'CRM',
      ownerId: 'c-tati',
      start: '2025-08-04',
      end: '2025-10-14',
      health: 'Atenção',
    },
    {
      id: 'p-renova',
      client: 'Renova Be (Vitable)',
      name: 'RFP CRM - Estratégia + Operação Insider',
      pillar: 'CRM',
      ownerId: 'c-marlon',
      start: '2025-07-31',
      end: '2025-09-29',
      health: 'Saudável',
    },
    {
      id: 'p-jde',
      client: "JDE Peet's",
      name: 'Proposta CRM + Martech + EcomAudit',
      pillar: 'Consultoria',
      ownerId: 'c-thales',
      start: '2025-08-26',
      end: '2025-08-29',
      health: 'Atenção',
    },
    {
      id: 'p-bridge',
      client: 'Bridge (Produto)',
      name: 'SDK Atribuição + Site + Conteúdo',
      pillar: 'Tech',
      ownerId: 'c-thiago',
      start: '2025-07-09',
      end: '2025-11-29',
      health: 'Saudável',
    },
    {
      id: 'p-aramis',
      client: 'Aramis',
      name: 'Lançamento E-commerce + MorphoPen',
      pillar: 'Martech',
      ownerId: 'c-thales',
      start: '2025-07-23',
      end: '2025-09-14',
      health: 'Atenção',
    },
  ];

  // Board (5 colunas)
  const board: BoardActivity[] = [
    { id: uid(), title: 'Mini cart VTEX: mapeamento de eventos', status: 'backlog', points: 5, assigneeId: 'c-thiago', client: 'Webcontinental', project: 'Re-implementação Insider + CRM Ops', pillar: 'Tech', due: '2025-08-26' },
    { id: uid(), title: 'Estimativa de esforço + staffing', status: 'backlog', points: 2, assigneeId: 'c-thales', client: 'Renova Be (Vitable)', project: 'RFP CRM - Estratégia + Operação Insider', pillar: 'Vendas/Strategy', due: '2025-08-18' },
    { id: uid(), title: 'Warm-up da base + fluxos LGPD', status: 'todo', points: 3, assigneeId: 'c-tati', client: 'Webcontinental', project: 'Re-implementação Insider + CRM Ops', pillar: 'CSM', due: '2025-08-24' },
    { id: uid(), title: 'Deck comercial e técnico (versão 1)', status: 'doing', points: 3, assigneeId: 'c-marlon', client: 'Renova Be (Vitable)', project: 'RFP CRM - Estratégia + Operação Insider', pillar: 'CSM', due: '2025-08-19' },
    { id: uid(), title: 'Comparativo MMP vs Bridge (artigo)', status: 'doing', points: 2, assigneeId: 'c-thales', client: 'Bridge (Produto)', project: 'SDK Atribuição + Site + Conteúdo', pillar: 'Vendas/Strategy', due: '2025-08-20' },
    { id: uid(), title: 'Deferred deep link: testes Android/iOS', status: 'review', points: 8, assigneeId: 'c-thiago', client: 'Bridge (Produto)', project: 'SDK Atribuição + Site + Conteúdo', pillar: 'Tech', due: '2025-08-28' },
    { id: uid(), title: 'Fotos padrão MorphoPen azul (hand model)', status: 'review', points: 3, assigneeId: 'c-thales', client: 'Joy Solutions', project: 'Lançamento E-commerce + MorphoPen', pillar: 'Vendas/Strategy', due: '2025-08-22' },
    { id: uid(), title: 'Auditoria de eventos e tagbook (GA4/MMP)', status: 'done', points: 5, assigneeId: 'c-larissa', client: 'Webcontinental', project: 'Re-implementação Insider + CRM Ops', pillar: 'CRM', due: '2025-08-21' },
    { id: uid(), title: 'Catálogo + SEO + GMC', status: 'done', points: 5, assigneeId: 'c-thales', client: 'Joy Solutions', project: 'Lançamento E-commerce + MorphoPen', pillar: 'Vendas/Strategy', due: '2025-08-25' },
  ];

  // OKRs (2 exemplos)
  const okrs: OKR[] = [
    {
      id: uid(),
      title: 'Consolidar Caaqui como referência em CRM e Martech',
      activities: [
        { id: uid(), title: 'Fechar 2 contratos fixos de CRM', assigneeId: 'c-thales' },
        { id: uid(), title: 'Lançar MVP do EcomAudit com 3 pilotos', assigneeId: 'c-thiago' },
        { id: uid(), title: 'Publicar 8 conteúdos do Bridge (blog/cases)', assigneeId: 'c-paula' },
      ],
    },
    {
      id: uid(),
      title: 'Aumentar eficiência operacional e governança',
      activities: [
        { id: uid(), title: 'Utilização média de 75% +/- 10%', assigneeId: 'c-tati' },
        { id: uid(), title: 'NPS > 60 com clientes ativos', assigneeId: 'c-marlon' },
        { id: uid(), title: 'Reduzir retrabalho técnico em 30%', assigneeId: 'c-thiago' },
      ],
    },
  ];

  // Rituais (tabela simples)
  const rituals: Ritual[] = [
    { id: uid(), title: 'Planning semanal', owner: 'CSM/PO', when: 'Segunda — 10:00' },
    { id: uid(), title: 'Daily geral (15min)', owner: 'Todos', when: 'Diário — 09:30' },
    { id: uid(), title: 'Tech sync', owner: 'Thiago', when: 'Terça — 15:00' },
    { id: uid(), title: 'CRM/Insider ops', owner: 'Tati/Larissa', when: 'Quarta — 11:00' },
    { id: uid(), title: 'Check financeiro/comercial', owner: 'Thales/Davi', when: 'Quinta — 16:30' },
  ];

  return { cols, projects, board, okrs, rituals };
};

export const useAppStore = create<Store>()(
  persist(
    (set, get) => {
      // Seed somente na primeira carga (sem dados)
      const { cols, projects, board, okrs, rituals } = seed();
      return {
        collaborators: cols,
        projects,
        boardActivities: board,
        okrs,
        rituals,

        // ---- Collaborators
        addCollaborator: (name, role, email) => {
          const c: Collaborator = { id: uid(), name: name.trim(), role: role?.trim() || undefined, email: email?.trim() || undefined, capacity: 25 };
          set((s) => ({ collaborators: [c, ...s.collaborators] }));
        },
        updateCollaborator: (id, patch) => {
          set((s) => ({ collaborators: s.collaborators.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
        },
        deleteCollaborator: (id) => {
          const s = get();
          const collaborators = s.collaborators.filter((c) => c.id !== id);
          const boardActivities = s.boardActivities.map((a) => (a.assigneeId === id ? { ...a, assigneeId: undefined } : a));
          const okrs = s.okrs.map((o) => ({
            ...o,
            activities: o.activities.map((a) => (a.assigneeId === id ? { ...a, assigneeId: undefined } : a)),
          }));
          set({ collaborators, boardActivities, okrs });
        },

        // ---- Board
        addBoardActivity: (title, extra) => {
          const a: BoardActivity = {
            id: uid(),
            title: title.trim(),
            status: extra?.status ?? 'todo',
            points: extra?.points ?? 1,
            assigneeId: extra?.assigneeId,
            client: extra?.client,
            project: extra?.project,
            pillar: extra?.pillar,
            due: extra?.due,
          };
          set((s) => ({ boardActivities: [a, ...s.boardActivities] }));
        },
        setBoardStatus: (id, status) => {
          set((s) => ({ boardActivities: s.boardActivities.map((a) => (a.id === id ? { ...a, status } : a)) }));
        },
        setBoardAssignee: (id, assigneeId) => {
          set((s) => ({ boardActivities: s.boardActivities.map((a) => (a.id === id ? { ...a, assigneeId } : a)) }));
        },
        deleteBoardActivity: (id) => {
          set((s) => ({ boardActivities: s.boardActivities.filter((a) => a.id !== id) }));
        },

        // ---- OKRs
        addOKR: (title) => {
          set((s) => {
            if (s.okrs.length >= 5) return s;
            const o: OKR = { id: uid(), title: title.trim(), activities: [] };
            return { okrs: [o, ...s.okrs] };
          });
        },
        deleteOKR: (id) => set((s) => ({ okrs: s.okrs.filter((o) => o.id !== id) })),
        addOKRActivity: (okrId, title) =>
          set((s) => ({
            okrs: s.okrs.map((o) =>
              o.id === okrId ? { ...o, activities: [{ id: uid(), title: title.trim() }, ...o.activities] } : o
            ),
          })),
        deleteOKRActivity: (okrId, actId) =>
          set((s) => ({
            okrs: s.okrs.map((o) =>
              o.id === okrId
                ? { ...o, activities: o.activities.filter((a) => a.id !== actId) }
                : o
            ),
          })),
        setActivityAssignee: (okrId, actId, assigneeId) =>
          set((s) => ({
            okrs: s.okrs.map((o) =>
              o.id === okrId
                ? {
                    ...o,
                    activities: o.activities.map((a) => (a.id === actId ? { ...a, assigneeId } : a)),
                  }
                : o
            ),
          })),

        // --------- Rituais ----------
        addRitual: (title, extra) =>
          set((s) => {
            const r: Ritual = { id: uid(), title: title.trim(), notes: '' };
            return { rituals: [r, ...s.rituals] };
          }),
        updateRitual: (id, patch) =>
          set((s) => ({
            rituals: s.rituals.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          })),
        deleteRitual: (id) =>
          set((s) => ({ rituals: s.rituals.filter((r) => r.id !== id) })),

        // --------- Projects ----------
        addProject: (p) =>
          set((s) => {
            const proj: Project = { id: uid(), ...p };
            return { projects: [proj, ...s.projects] };
          }),
        updateProject: (id, patch) =>
          set((s) => ({
            projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          })),
        deleteProject: (id) =>
          set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
      };
    },
    {
      name: 'caaqui-store-v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

// Não coloque JSX aqui!

{/* Painel de nova tarefa */}
