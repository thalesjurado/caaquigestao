// Tipos expandidos para suportar projetos com datas, tipos e alocação

export interface Project {
  id: string;
  name: string;
  client: string;
  type: 'tech' | 'growth';
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';
  startDate: Date;
  endDate: Date;
  description?: string;
  budget?: number;
  
  // Alocação da equipe
  allocations: ProjectAllocation[];
  
  // Data de arquivamento
  archivedAt?: Date;
  
  // Detalhes específicos para projetos tech
  techDetails?: {
    platform?: string;
    integrations?: string[];
    cdpIntegration?: string;
    martechTools?: string[];
  };
  
  growthDetails?: {
    crmPlatform?: string;
    campaignType?: string;
    expectedResults?: string;
  };
}

export interface ProjectAllocation {
  id: string;
  projectId: string;
  collaboratorId: string;
  percentage: number; // 0-100, quanto % da pessoa está alocada
  role: string; // função específica no projeto
  // Tipo de hora para DevOps: faturável, não faturável ou produto interno
  hourType: 'billable' | 'non_billable' | 'product';
  // Horas previstas por mês para esta alocação
  plannedHoursMonthly?: number;
  startDate: Date;
  endDate: Date;
}

// Expandindo BoardActivity para referenciar projetos
export interface BoardActivity {
  id: string;
  title: string;
  status: 'backlog' | 'todo' | 'doing' | 'done' | 'historical';
  assigneeId?: string;
  description?: string;
  client?: string; // Mantendo para compatibilidade
  projectId?: string; // Nova referência ao projeto
  points?: number;
  createdAt?: Date;
  dueDate?: Date; // Nova data de vencimento
  subtasks?: string[];
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  hourlyRate?: number; // Para cálculos de custo
  maxAllocation?: number; // Máximo % que pode ser alocado (default 100)
  accessLevel: 'operations' | 'management' | 'executive'; // Nível de acesso
  position: string; // Cargo específico (ex: "Desenvolvedor", "Tech Lead", "Sócio")
}

export interface OKR {
  id: string;
  title: string;
  description: string;
  progress: number;
  quarter: string; // Q1 2024, Q2 2024, etc.
  activities: Array<{
    id: string;
    title: string;
    assigneeId?: string;
    projectId?: string; // Vincular atividades OKR a projetos
  }>;
}

export interface Ritual {
  id: string;
  title: string;
  content?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextDate?: Date;
}

// Tipos para dashboard de disponibilidade
export interface TeamAvailability {
  collaboratorId: string;
  name: string;
  role: string;
  totalAllocation: number; // % total alocado
  availableAllocation: number; // % disponível
  projects: Array<{
    projectId: string;
    projectName: string;
    allocation: number;
    endDate: Date;
  }>;
}

// Tipos para métricas de projeto
export interface ProjectMetrics {
  id: string;
  name: string;
  status: Project['status'];
  progressPct: number;
  daysRemaining: number;
  isOnTime: boolean;
  totalAllocation: number;
  realCost: number;
  budgetVariance: number;
}

// Tipos para Sprints DevOps
export interface Sprint {
  id: string;
  projectId: string;
  number: number;
  name?: string;
  startDate: Date;
  endDate: Date;
  objective?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  plannedHoursBillable?: number;
  plannedHoursNonBillable?: number;
  plannedHoursProduct?: number;
  retrospective?: string;
}

export interface SprintEntry {
  id: string;
  sprintId: string;
  projectId: string;
  collaboratorId?: string;
  title: string;
  status: 'backlog' | 'in_sprint' | 'done' | 'moved_backlog';
  plannedHours?: number;
  spentHours?: number;
  reason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
