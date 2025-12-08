// Sistema de Notificações Automáticas
import { toast } from './toast';
import { Project, ProjectAllocation } from './types';
import { Collaborator } from './store-supabase';

export interface NotificationRule {
  id: string;
  name: string;
  type: 'deadline' | 'overallocation' | 'status_change' | 'milestone' | 'reminder';
  enabled: boolean;
  conditions: {
    daysBeforeDeadline?: number;
    allocationThreshold?: number;
    statusFrom?: string;
    statusTo?: string;
    frequency?: 'daily' | 'weekly' | 'monthly';
  };
  recipients: string[]; // IDs dos colaboradores
  message: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  projectId?: string;
  collaboratorId?: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
}

class NotificationService {
  private rules: NotificationRule[] = [];
  private notifications: Notification[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadRules();
    this.loadNotifications();
    this.startPeriodicCheck();
  }

  // Regras padrão do sistema
  getDefaultRules(): NotificationRule[] {
    return [
      {
        id: 'deadline-7-days',
        name: 'Prazo em 7 dias',
        type: 'deadline',
        enabled: true,
        conditions: { daysBeforeDeadline: 7 },
        recipients: ['all'],
        message: 'O projeto {projectName} tem prazo em 7 dias ({deadline})'
      },
      {
        id: 'deadline-3-days',
        name: 'Prazo em 3 dias',
        type: 'deadline',
        enabled: true,
        conditions: { daysBeforeDeadline: 3 },
        recipients: ['all'],
        message: '⚠️ URGENTE: O projeto {projectName} tem prazo em 3 dias ({deadline})'
      },
      {
        id: 'deadline-today',
        name: 'Prazo hoje',
        type: 'deadline',
        enabled: true,
        conditions: { daysBeforeDeadline: 0 },
        recipients: ['all'],
        message: '🚨 CRÍTICO: O projeto {projectName} tem prazo HOJE ({deadline})'
      },
      {
        id: 'overallocation-100',
        name: 'Sobrecarga de equipe',
        type: 'overallocation',
        enabled: true,
        conditions: { allocationThreshold: 100 },
        recipients: ['management'],
        message: '⚠️ {collaboratorName} está com alocação acima de 100% ({percentage}%)'
      },
      {
        id: 'project-completed',
        name: 'Projeto concluído',
        type: 'status_change',
        enabled: true,
        conditions: { statusTo: 'completed' },
        recipients: ['all'],
        message: '🎉 Projeto {projectName} foi concluído com sucesso!'
      },
      {
        id: 'project-cancelled',
        name: 'Projeto cancelado',
        type: 'status_change',
        enabled: true,
        conditions: { statusTo: 'cancelled' },
        recipients: ['management'],
        message: '❌ Projeto {projectName} foi cancelado'
      }
    ];
  }

  // Verificar projetos próximos ao prazo
  checkDeadlines(projects: Project[]): Notification[] {
    const notifications: Notification[] = [];
    const now = new Date();
    
    const deadlineRules = this.rules.filter(r => r.type === 'deadline' && r.enabled);
    
    for (const project of projects) {
      if (project.status === 'completed' || project.status === 'cancelled') continue;
      
      const deadline = new Date(project.endDate);
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      for (const rule of deadlineRules) {
        const targetDays = rule.conditions.daysBeforeDeadline || 0;
        
        if (diffDays === targetDays) {
          const notification: Notification = {
            id: `deadline-${project.id}-${targetDays}`,
            type: diffDays <= 0 ? 'error' : diffDays <= 3 ? 'warning' : 'info',
            title: 'Alerta de Prazo',
            message: rule.message
              .replace('{projectName}', project.name)
              .replace('{deadline}', deadline.toLocaleDateString('pt-BR')),
            projectId: project.id,
            createdAt: now,
            read: false,
            actionUrl: `#projects`
          };
          
          notifications.push(notification);
        }
      }
    }
    
    return notifications;
  }

  // Verificar sobrecarga de equipe
  checkOverallocation(
    collaborators: Collaborator[], 
    allocations: ProjectAllocation[]
  ): Notification[] {
    const notifications: Notification[] = [];
    const now = new Date();
    
    const overallocationRules = this.rules.filter(r => r.type === 'overallocation' && r.enabled);
    
    for (const collaborator of collaborators) {
      const activeAllocations = allocations.filter(a => 
        a.collaboratorId === collaborator.id &&
        new Date(a.startDate) <= now &&
        new Date(a.endDate) >= now
      );
      
      const totalAllocation = activeAllocations.reduce((sum, a) => sum + a.percentage, 0);
      
      for (const rule of overallocationRules) {
        const threshold = rule.conditions.allocationThreshold || 100;
        
        if (totalAllocation > threshold) {
          const notification: Notification = {
            id: `overallocation-${collaborator.id}`,
            type: 'warning',
            title: 'Sobrecarga de Equipe',
            message: rule.message
              .replace('{collaboratorName}', collaborator.name)
              .replace('{percentage}', totalAllocation.toString()),
            collaboratorId: collaborator.id,
            createdAt: now,
            read: false,
            actionUrl: `#availability`
          };
          
          notifications.push(notification);
        }
      }
    }
    
    return notifications;
  }

  // Verificar mudanças de status
  checkStatusChanges(oldProjects: Project[], newProjects: Project[]): Notification[] {
    const notifications: Notification[] = [];
    const now = new Date();
    
    const statusRules = this.rules.filter(r => r.type === 'status_change' && r.enabled);
    
    for (const newProject of newProjects) {
      const oldProject = oldProjects.find(p => p.id === newProject.id);
      
      if (oldProject && oldProject.status !== newProject.status) {
        for (const rule of statusRules) {
          const matchesFrom = !rule.conditions.statusFrom || rule.conditions.statusFrom === oldProject.status;
          const matchesTo = !rule.conditions.statusTo || rule.conditions.statusTo === newProject.status;
          
          if (matchesFrom && matchesTo) {
            const notification: Notification = {
              id: `status-${newProject.id}-${newProject.status}`,
              type: newProject.status === 'completed' ? 'success' : 
                    newProject.status === 'cancelled' ? 'error' : 'info',
              title: 'Mudança de Status',
              message: rule.message.replace('{projectName}', newProject.name),
              projectId: newProject.id,
              createdAt: now,
              read: false,
              actionUrl: `#projects`
            };
            
            notifications.push(notification);
          }
        }
      }
    }
    
    return notifications;
  }

  // Executar todas as verificações
  runChecks(
    projects: Project[], 
    collaborators: Collaborator[], 
    allocations: ProjectAllocation[],
    oldProjects?: Project[]
  ): void {
    const newNotifications: Notification[] = [];
    
    // Verificar prazos
    newNotifications.push(...this.checkDeadlines(projects));
    
    // Verificar sobrecarga
    newNotifications.push(...this.checkOverallocation(collaborators, allocations));
    
    // Verificar mudanças de status
    if (oldProjects) {
      newNotifications.push(...this.checkStatusChanges(oldProjects, projects));
    }
    
    // Adicionar novas notificações
    for (const notification of newNotifications) {
      // Evitar duplicatas
      const exists = this.notifications.some(n => n.id === notification.id);
      if (!exists) {
        this.addNotification(notification);
      }
    }
  }

  // Adicionar notificação
  addNotification(notification: Notification): void {
    this.notifications.unshift(notification);
    this.saveNotifications();
    
    // Mostrar toast para notificações importantes
    if (notification.type === 'error') {
      toast.error(notification.message);
    } else if (notification.type === 'warning') {
      toast.warning(notification.message);
    } else if (notification.type === 'success') {
      toast.success(notification.message);
    }
  }

  // Marcar como lida
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  // Marcar todas como lidas
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  // Remover notificação
  removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  // Limpar notificações antigas (mais de 30 dias)
  cleanupOldNotifications(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.notifications = this.notifications.filter(n => 
      new Date(n.createdAt) > thirtyDaysAgo
    );
    this.saveNotifications();
  }

  // Getters
  getNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  getUnreadCount(): number {
    return this.getUnreadNotifications().length;
  }

  getRules(): NotificationRule[] {
    return this.rules;
  }

  // Configuração de regras
  updateRule(ruleId: string, updates: Partial<NotificationRule>): void {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex >= 0) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
      this.saveRules();
    }
  }

  addCustomRule(rule: NotificationRule): void {
    this.rules.push(rule);
    this.saveRules();
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
    this.saveRules();
  }

  // Verificação periódica (a cada 5 minutos)
  private startPeriodicCheck(): void {
    if (typeof window === 'undefined') return; // Só no browser
    
    this.checkInterval = setInterval(() => {
      // Esta verificação será chamada pelo store principal
      // quando houver dados disponíveis
    }, 5 * 60 * 1000); // 5 minutos
  }

  // Persistência
  private loadRules(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('caaqui_notification_rules');
      if (saved) {
        this.rules = JSON.parse(saved);
      } else {
        this.rules = this.getDefaultRules();
        this.saveRules();
      }
    } catch {
      this.rules = this.getDefaultRules();
    }
  }

  private saveRules(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('caaqui_notification_rules', JSON.stringify(this.rules));
    } catch (error) {
      console.warn('Erro ao salvar regras de notificação:', error);
    }
  }

  private loadNotifications(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('caaqui_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
      }
    } catch {
      this.notifications = [];
    }
  }

  private saveNotifications(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('caaqui_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.warn('Erro ao salvar notificações:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Instância singleton
export const notificationService = new NotificationService();

// Hook para usar no React
export function useNotifications() {
  return {
    notifications: notificationService.getNotifications(),
    unreadNotifications: notificationService.getUnreadNotifications(),
    unreadCount: notificationService.getUnreadCount(),
    rules: notificationService.getRules(),
    markAsRead: (id: string) => notificationService.markAsRead(id),
    markAllAsRead: () => notificationService.markAllAsRead(),
    removeNotification: (id: string) => notificationService.removeNotification(id),
    updateRule: (id: string, updates: Partial<NotificationRule>) => 
      notificationService.updateRule(id, updates),
    addCustomRule: (rule: NotificationRule) => notificationService.addCustomRule(rule),
    removeRule: (id: string) => notificationService.removeRule(id)
  };
}
