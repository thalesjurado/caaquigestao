// Sistema de Integração com Ferramentas de Time Tracking
import { Project, ProjectAllocation } from './types';
import { Collaborator } from './store-supabase';

export interface TimeEntry {
  id: string;
  projectId: string;
  collaboratorId: string;
  taskId?: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // em minutos
  billable: boolean;
  hourlyRate?: number;
  tags: string[];
  source: 'manual' | 'toggl' | 'clockify' | 'harvest' | 'clockwise';
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeTrackingProvider {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  workspaceId?: string;
  lastSync?: Date;
  syncInterval: number; // em minutos
  autoSync: boolean;
}

export interface TimeTrackingStats {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  totalCost: number;
  averageHourlyRate: number;
  entriesCount: number;
  topProjects: Array<{
    projectId: string;
    projectName: string;
    hours: number;
    cost: number;
  }>;
  topCollaborators: Array<{
    collaboratorId: string;
    collaboratorName: string;
    hours: number;
    cost: number;
  }>;
}

export interface ProjectTimeReport {
  projectId: string;
  projectName: string;
  totalHours: number;
  billableHours: number;
  totalCost: number;
  budgetUsed: number; // percentual
  collaborators: Array<{
    id: string;
    name: string;
    hours: number;
    cost: number;
    allocation: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    hours: number;
    cost: number;
  }>;
  tasks: Array<{
    taskId: string;
    description: string;
    hours: number;
    cost: number;
  }>;
}

class TimeTrackingService {
  private entries: TimeEntry[] = [];
  private providers: TimeTrackingProvider[] = [];
  private activeTimer: {
    projectId: string;
    collaboratorId: string;
    description: string;
    startTime: Date;
  } | null = null;

  constructor() {
    this.loadData();
    this.initializeDefaultProviders();
  }

  // Inicializar provedores padrão
  private initializeDefaultProviders(): void {
    if (this.providers.length === 0) {
      this.providers = [
        {
          id: 'manual',
          name: 'Manual',
          enabled: true,
          syncInterval: 0,
          autoSync: false
        },
        {
          id: 'toggl',
          name: 'Toggl Track',
          enabled: false,
          syncInterval: 15,
          autoSync: false
        },
        {
          id: 'clockify',
          name: 'Clockify',
          enabled: false,
          syncInterval: 15,
          autoSync: false
        },
        {
          id: 'harvest',
          name: 'Harvest',
          enabled: false,
          syncInterval: 30,
          autoSync: false
        }
      ];
      this.saveProviders();
    }
  }

  // Timer ativo
  startTimer(projectId: string, collaboratorId: string, description: string): void {
    if (this.activeTimer) {
      this.stopTimer();
    }

    this.activeTimer = {
      projectId,
      collaboratorId,
      description,
      startTime: new Date()
    };

    this.saveActiveTimer();
  }

  stopTimer(): TimeEntry | null {
    if (!this.activeTimer) return null;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - this.activeTimer.startTime.getTime()) / 60000);

    const entry: TimeEntry = {
      id: this.generateId(),
      projectId: this.activeTimer.projectId,
      collaboratorId: this.activeTimer.collaboratorId,
      description: this.activeTimer.description,
      startTime: this.activeTimer.startTime,
      endTime,
      duration,
      billable: true,
      tags: [],
      source: 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.addEntry(entry);
    this.activeTimer = null;
    this.saveActiveTimer();

    return entry;
  }

  getActiveTimer() {
    return this.activeTimer;
  }

  // CRUD Entries
  addEntry(entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): TimeEntry {
    const newEntry: TimeEntry = {
      ...entry,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.entries.unshift(newEntry);
    this.saveEntries();
    return newEntry;
  }

  updateEntry(id: string, updates: Partial<TimeEntry>): void {
    const index = this.entries.findIndex(e => e.id === id);
    if (index >= 0) {
      this.entries[index] = {
        ...this.entries[index],
        ...updates,
        updatedAt: new Date()
      };
      this.saveEntries();
    }
  }

  deleteEntry(id: string): void {
    this.entries = this.entries.filter(e => e.id !== id);
    this.saveEntries();
  }

  getEntries(): TimeEntry[] {
    return this.entries;
  }

  getEntriesByProject(projectId: string): TimeEntry[] {
    return this.entries.filter(e => e.projectId === projectId);
  }

  getEntriesByCollaborator(collaboratorId: string): TimeEntry[] {
    return this.entries.filter(e => e.collaboratorId === collaboratorId);
  }

  getEntriesByDateRange(start: Date, end: Date): TimeEntry[] {
    return this.entries.filter(e => 
      e.startTime >= start && e.startTime <= end
    );
  }

  // Estatísticas
  getStats(
    dateRange?: { start: Date; end: Date },
    projectId?: string,
    collaboratorId?: string
  ): TimeTrackingStats {
    let filteredEntries = this.entries;

    if (dateRange) {
      filteredEntries = filteredEntries.filter(e => 
        e.startTime >= dateRange.start && e.startTime <= dateRange.end
      );
    }

    if (projectId) {
      filteredEntries = filteredEntries.filter(e => e.projectId === projectId);
    }

    if (collaboratorId) {
      filteredEntries = filteredEntries.filter(e => e.collaboratorId === collaboratorId);
    }

    const totalMinutes = filteredEntries.reduce((sum, e) => sum + e.duration, 0);
    const billableMinutes = filteredEntries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0);
    const totalHours = totalMinutes / 60;
    const billableHours = billableMinutes / 60;

    const totalCost = filteredEntries.reduce((sum, e) => {
      const rate = e.hourlyRate || 0;
      return sum + (e.duration / 60) * rate;
    }, 0);

    // Top projetos
    const projectStats = new Map<string, { hours: number; cost: number; name: string }>();
    filteredEntries.forEach(entry => {
      const existing = projectStats.get(entry.projectId) || { hours: 0, cost: 0, name: entry.projectId };
      const hours = entry.duration / 60;
      const cost = hours * (entry.hourlyRate || 0);
      
      projectStats.set(entry.projectId, {
        hours: existing.hours + hours,
        cost: existing.cost + cost,
        name: existing.name
      });
    });

    // Top colaboradores
    const collaboratorStats = new Map<string, { hours: number; cost: number; name: string }>();
    filteredEntries.forEach(entry => {
      const existing = collaboratorStats.get(entry.collaboratorId) || { hours: 0, cost: 0, name: entry.collaboratorId };
      const hours = entry.duration / 60;
      const cost = hours * (entry.hourlyRate || 0);
      
      collaboratorStats.set(entry.collaboratorId, {
        hours: existing.hours + hours,
        cost: existing.cost + cost,
        name: existing.name
      });
    });

    return {
      totalHours,
      billableHours,
      nonBillableHours: totalHours - billableHours,
      totalCost,
      averageHourlyRate: totalHours > 0 ? totalCost / totalHours : 0,
      entriesCount: filteredEntries.length,
      topProjects: Array.from(projectStats.entries())
        .map(([projectId, stats]) => ({
          projectId,
          projectName: stats.name,
          hours: Math.round(stats.hours * 100) / 100,
          cost: Math.round(stats.cost * 100) / 100
        }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5),
      topCollaborators: Array.from(collaboratorStats.entries())
        .map(([collaboratorId, stats]) => ({
          collaboratorId,
          collaboratorName: stats.name,
          hours: Math.round(stats.hours * 100) / 100,
          cost: Math.round(stats.cost * 100) / 100
        }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5)
    };
  }

  // Relatório detalhado do projeto
  getProjectTimeReport(
    projectId: string,
    dateRange: { start: Date; end: Date },
    project?: Project,
    collaborators?: Collaborator[],
    allocations?: ProjectAllocation[]
  ): ProjectTimeReport {
    const entries = this.getEntriesByProject(projectId).filter(e =>
      e.startTime >= dateRange.start && e.startTime <= dateRange.end
    );

    const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
    const billableMinutes = entries.filter(e => e.billable).reduce((sum, e) => sum + e.duration, 0);
    const totalHours = totalMinutes / 60;
    const billableHours = billableMinutes / 60;

    const totalCost = entries.reduce((sum, e) => {
      const rate = e.hourlyRate || 0;
      return sum + (e.duration / 60) * rate;
    }, 0);

    const budgetUsed = project?.budget ? (totalCost / project.budget) * 100 : 0;

    // Breakdown por colaborador
    const collaboratorStats = new Map<string, { hours: number; cost: number }>();
    entries.forEach(entry => {
      const existing = collaboratorStats.get(entry.collaboratorId) || { hours: 0, cost: 0 };
      const hours = entry.duration / 60;
      const cost = hours * (entry.hourlyRate || 0);
      
      collaboratorStats.set(entry.collaboratorId, {
        hours: existing.hours + hours,
        cost: existing.cost + cost
      });
    });

    const collaboratorBreakdown = Array.from(collaboratorStats.entries()).map(([id, stats]) => {
      const collaborator = collaborators?.find(c => c.id === id);
      const allocation = allocations?.find(a => a.collaboratorId === id);
      
      return {
        id,
        name: collaborator?.name || id,
        hours: Math.round(stats.hours * 100) / 100,
        cost: Math.round(stats.cost * 100) / 100,
        allocation: allocation?.percentage || 0
      };
    });

    // Breakdown diário
    const dailyStats = new Map<string, { hours: number; cost: number }>();
    entries.forEach(entry => {
      const date = entry.startTime.toISOString().split('T')[0];
      const existing = dailyStats.get(date) || { hours: 0, cost: 0 };
      const hours = entry.duration / 60;
      const cost = hours * (entry.hourlyRate || 0);
      
      dailyStats.set(date, {
        hours: existing.hours + hours,
        cost: existing.cost + cost
      });
    });

    const dailyBreakdown = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        hours: Math.round(stats.hours * 100) / 100,
        cost: Math.round(stats.cost * 100) / 100
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Breakdown por tarefa
    const taskStats = new Map<string, { hours: number; cost: number; description: string }>();
    entries.forEach(entry => {
      const taskId = entry.taskId || 'no-task';
      const existing = taskStats.get(taskId) || { hours: 0, cost: 0, description: entry.description };
      const hours = entry.duration / 60;
      const cost = hours * (entry.hourlyRate || 0);
      
      taskStats.set(taskId, {
        hours: existing.hours + hours,
        cost: existing.cost + cost,
        description: existing.description
      });
    });

    const taskBreakdown = Array.from(taskStats.entries()).map(([taskId, stats]) => ({
      taskId,
      description: stats.description,
      hours: Math.round(stats.hours * 100) / 100,
      cost: Math.round(stats.cost * 100) / 100
    }));

    return {
      projectId,
      projectName: project?.name || projectId,
      totalHours: Math.round(totalHours * 100) / 100,
      billableHours: Math.round(billableHours * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      budgetUsed: Math.round(budgetUsed * 100) / 100,
      collaborators: collaboratorBreakdown,
      dailyBreakdown,
      tasks: taskBreakdown
    };
  }

  // Integração com provedores externos
  async syncWithProvider(providerId: string): Promise<void> {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider || !provider.enabled) {
      throw new Error('Provider não encontrado ou desabilitado');
    }

    switch (providerId) {
      case 'toggl':
        await this.syncWithToggl(provider);
        break;
      case 'clockify':
        await this.syncWithClockify(provider);
        break;
      case 'harvest':
        await this.syncWithHarvest(provider);
        break;
      default:
        throw new Error('Provider não suportado');
    }

    provider.lastSync = new Date();
    this.saveProviders();
  }

  private async syncWithToggl(provider: TimeTrackingProvider): Promise<void> {
    // Implementação simulada - em produção faria chamadas reais para API
    console.log('Sincronizando com Toggl...');
    
    // Simulação de dados do Toggl
    const mockTogglEntries = [
      {
        id: 'toggl_1',
        description: 'Desenvolvimento de feature',
        start: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        duration: 120, // 2 horas
        project: { name: 'Projeto A' },
        user: { name: 'João Silva' }
      }
    ];

    // Converter e adicionar entradas
    mockTogglEntries.forEach(togglEntry => {
      const existingEntry = this.entries.find(e => e.externalId === togglEntry.id);
      if (!existingEntry) {
        this.addEntry({
          projectId: 'mock-project-id',
          collaboratorId: 'mock-collaborator-id',
          description: togglEntry.description,
          startTime: togglEntry.start,
          endTime: new Date(togglEntry.start.getTime() + togglEntry.duration * 60000),
          duration: togglEntry.duration,
          billable: true,
          tags: ['toggl'],
          source: 'toggl',
          externalId: togglEntry.id
        });
      }
    });
  }

  private async syncWithClockify(provider: TimeTrackingProvider): Promise<void> {
    console.log('Sincronizando com Clockify...');
    // Implementação similar ao Toggl
  }

  private async syncWithHarvest(provider: TimeTrackingProvider): Promise<void> {
    console.log('Sincronizando com Harvest...');
    // Implementação similar ao Toggl
  }

  // Configuração de provedores
  updateProvider(id: string, updates: Partial<TimeTrackingProvider>): void {
    const index = this.providers.findIndex(p => p.id === id);
    if (index >= 0) {
      this.providers[index] = { ...this.providers[index], ...updates };
      this.saveProviders();
    }
  }

  getProviders(): TimeTrackingProvider[] {
    return this.providers;
  }

  getProvider(id: string): TimeTrackingProvider | undefined {
    return this.providers.find(p => p.id === id);
  }

  // Utilitários
  private generateId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  // Persistência
  private loadData(): void {
    if (typeof window === 'undefined') return;

    try {
      const savedEntries = localStorage.getItem('caaqui_time_entries');
      if (savedEntries) {
        this.entries = JSON.parse(savedEntries).map((e: any) => ({
          ...e,
          startTime: new Date(e.startTime),
          endTime: e.endTime ? new Date(e.endTime) : undefined,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt)
        }));
      }

      const savedProviders = localStorage.getItem('caaqui_time_providers');
      if (savedProviders) {
        this.providers = JSON.parse(savedProviders).map((p: any) => ({
          ...p,
          lastSync: p.lastSync ? new Date(p.lastSync) : undefined
        }));
      }

      const savedTimer = localStorage.getItem('caaqui_active_timer');
      if (savedTimer) {
        const timer = JSON.parse(savedTimer);
        this.activeTimer = {
          ...timer,
          startTime: new Date(timer.startTime)
        };
      }
    } catch (error) {
      console.warn('Erro ao carregar dados de time tracking:', error);
    }
  }

  private saveEntries(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('caaqui_time_entries', JSON.stringify(this.entries));
    } catch (error) {
      console.warn('Erro ao salvar entradas de tempo:', error);
    }
  }

  private saveProviders(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('caaqui_time_providers', JSON.stringify(this.providers));
    } catch (error) {
      console.warn('Erro ao salvar provedores de time tracking:', error);
    }
  }

  private saveActiveTimer(): void {
    if (typeof window === 'undefined') return;
    
    try {
      if (this.activeTimer) {
        localStorage.setItem('caaqui_active_timer', JSON.stringify(this.activeTimer));
      } else {
        localStorage.removeItem('caaqui_active_timer');
      }
    } catch (error) {
      console.warn('Erro ao salvar timer ativo:', error);
    }
  }
}

// Instância singleton
export const timeTrackingService = new TimeTrackingService();

// Hook para usar no React
export function useTimeTracking() {
  return {
    entries: timeTrackingService.getEntries(),
    providers: timeTrackingService.getProviders(),
    activeTimer: timeTrackingService.getActiveTimer(),
    
    // Timer
    startTimer: (projectId: string, collaboratorId: string, description: string) =>
      timeTrackingService.startTimer(projectId, collaboratorId, description),
    stopTimer: () => timeTrackingService.stopTimer(),
    
    // Entries
    addEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) =>
      timeTrackingService.addEntry(entry),
    updateEntry: (id: string, updates: Partial<TimeEntry>) =>
      timeTrackingService.updateEntry(id, updates),
    deleteEntry: (id: string) => timeTrackingService.deleteEntry(id),
    
    // Queries
    getEntriesByProject: (projectId: string) => timeTrackingService.getEntriesByProject(projectId),
    getEntriesByCollaborator: (collaboratorId: string) => timeTrackingService.getEntriesByCollaborator(collaboratorId),
    getEntriesByDateRange: (start: Date, end: Date) => timeTrackingService.getEntriesByDateRange(start, end),
    
    // Stats
    getStats: (dateRange?: { start: Date; end: Date }, projectId?: string, collaboratorId?: string) =>
      timeTrackingService.getStats(dateRange, projectId, collaboratorId),
    getProjectTimeReport: (projectId: string, dateRange: { start: Date; end: Date }, project?: Project, collaborators?: Collaborator[], allocations?: ProjectAllocation[]) =>
      timeTrackingService.getProjectTimeReport(projectId, dateRange, project, collaborators, allocations),
    
    // Providers
    updateProvider: (id: string, updates: Partial<TimeTrackingProvider>) =>
      timeTrackingService.updateProvider(id, updates),
    syncWithProvider: (providerId: string) => timeTrackingService.syncWithProvider(providerId),
    
    // Utils
    formatDuration: (minutes: number) => timeTrackingService.formatDuration(minutes)
  };
}
