// Tipos expandidos para suportar projetos com datas, tipos e alocação

export interface Project {
  id: string;
  name: string;
  client: string;
  type: 'tech_implementation' | 'growth_agency';
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  description?: string;
  budget?: number;
  
  // Alocação da equipe
  allocations: ProjectAllocation[];
  
  // Metadados específicos por tipo
  techDetails?: {
    sdkType?: string;
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
  projectId: string;
  name: string;
  client: string;
  type: string;
  status: string;
  progress: number; // % baseado em tarefas concluídas
  daysRemaining: number;
  isOnTime: boolean;
  teamSize: number;
  totalAllocation: number;
}
