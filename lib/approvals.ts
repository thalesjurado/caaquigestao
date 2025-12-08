// Sistema de Aprovações de Projetos
import { toast } from './toast';

export interface ApprovalRequest {
  id: string;
  type: 'budget_change' | 'scope_change' | 'timeline_change' | 'team_change' | 'project_creation' | 'project_cancellation';
  projectId: string;
  projectName: string;
  requestedBy: string;
  requestedByName: string;
  title: string;
  description: string;
  currentValue?: any;
  proposedValue?: any;
  justification: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvers: string[]; // IDs dos aprovadores necessários
  approvals: {
    approverId: string;
    approverName: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    timestamp?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  attachments?: string[];
}

export interface ApprovalRule {
  id: string;
  name: string;
  type: ApprovalRequest['type'];
  enabled: boolean;
  conditions: {
    budgetThreshold?: number;
    timelineChangeThreshold?: number; // dias
    requiresAllApprovers?: boolean;
    minimumApprovers?: number;
  };
  approvers: {
    role: 'management' | 'executive' | 'operations' | 'finance';
    required: boolean;
    collaboratorIds?: string[];
  }[];
  autoApprove?: {
    enabled: boolean;
    conditions: any;
  };
}

class ApprovalService {
  private requests: ApprovalRequest[] = [];
  private rules: ApprovalRule[] = [];

  constructor() {
    this.loadRequests();
    this.loadRules();
  }

  // Regras padrão do sistema
  getDefaultRules(): ApprovalRule[] {
    return [
      {
        id: 'budget-change-high',
        name: 'Mudança de Orçamento > R$ 10.000',
        type: 'budget_change',
        enabled: true,
        conditions: {
          budgetThreshold: 10000,
          requiresAllApprovers: false,
          minimumApprovers: 2
        },
        approvers: [
          { role: 'management', required: true },
          { role: 'executive', required: true }
        ]
      },
      {
        id: 'budget-change-medium',
        name: 'Mudança de Orçamento > R$ 5.000',
        type: 'budget_change',
        enabled: true,
        conditions: {
          budgetThreshold: 5000,
          requiresAllApprovers: false,
          minimumApprovers: 1
        },
        approvers: [
          { role: 'management', required: true }
        ]
      },
      {
        id: 'scope-change',
        name: 'Mudança de Escopo',
        type: 'scope_change',
        enabled: true,
        conditions: {
          requiresAllApprovers: false,
          minimumApprovers: 1
        },
        approvers: [
          { role: 'management', required: true }
        ]
      },
      {
        id: 'timeline-change-major',
        name: 'Mudança de Prazo > 7 dias',
        type: 'timeline_change',
        enabled: true,
        conditions: {
          timelineChangeThreshold: 7,
          requiresAllApprovers: false,
          minimumApprovers: 1
        },
        approvers: [
          { role: 'management', required: true }
        ]
      },
      {
        id: 'project-cancellation',
        name: 'Cancelamento de Projeto',
        type: 'project_cancellation',
        enabled: true,
        conditions: {
          requiresAllApprovers: true,
          minimumApprovers: 2
        },
        approvers: [
          { role: 'management', required: true },
          { role: 'executive', required: true }
        ]
      },
      {
        id: 'team-change',
        name: 'Mudança de Equipe',
        type: 'team_change',
        enabled: true,
        conditions: {
          requiresAllApprovers: false,
          minimumApprovers: 1
        },
        approvers: [
          { role: 'management', required: true }
        ]
      }
    ];
  }

  // Criar solicitação de aprovação
  async createApprovalRequest(
    type: ApprovalRequest['type'],
    projectId: string,
    projectName: string,
    requestedBy: string,
    requestedByName: string,
    data: {
      title: string;
      description: string;
      currentValue?: any;
      proposedValue?: any;
      justification: string;
      urgency?: ApprovalRequest['urgency'];
      deadline?: Date;
    }
  ): Promise<ApprovalRequest> {
    
    // Encontrar regras aplicáveis
    const applicableRules = this.getApplicableRules(type, data);
    
    if (applicableRules.length === 0) {
      throw new Error('Nenhuma regra de aprovação encontrada para este tipo de solicitação');
    }

    // Determinar aprovadores necessários
    const approvers = this.determineApprovers(applicableRules);
    
    const request: ApprovalRequest = {
      id: this.generateId(),
      type,
      projectId,
      projectName,
      requestedBy,
      requestedByName,
      title: data.title,
      description: data.description,
      currentValue: data.currentValue,
      proposedValue: data.proposedValue,
      justification: data.justification,
      urgency: data.urgency || 'medium',
      status: 'pending',
      approvers: approvers.map(a => a.id),
      approvals: approvers.map(a => ({
        approverId: a.id,
        approverName: a.name,
        status: 'pending' as const
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: data.deadline
    };

    this.requests.unshift(request);
    this.saveRequests();

    // Notificar aprovadores
    this.notifyApprovers(request);

    toast.info(`Solicitação de aprovação criada: ${request.title}`);
    
    return request;
  }

  // Aprovar/rejeitar solicitação
  async processApproval(
    requestId: string,
    approverId: string,
    status: 'approved' | 'rejected',
    comment?: string
  ): Promise<void> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Solicitação não encontrada');
    }

    const approval = request.approvals.find(a => a.approverId === approverId);
    if (!approval) {
      throw new Error('Você não está autorizado a aprovar esta solicitação');
    }

    if (approval.status !== 'pending') {
      throw new Error('Esta solicitação já foi processada por você');
    }

    // Atualizar aprovação
    approval.status = status;
    approval.comment = comment;
    approval.timestamp = new Date();
    request.updatedAt = new Date();

    // Verificar se todas as aprovações necessárias foram obtidas
    const pendingApprovals = request.approvals.filter(a => a.status === 'pending');
    const approvedCount = request.approvals.filter(a => a.status === 'approved').length;
    const rejectedCount = request.approvals.filter(a => a.status === 'rejected').length;

    // Se alguma aprovação foi rejeitada, rejeitar toda a solicitação
    if (rejectedCount > 0) {
      request.status = 'rejected';
      toast.error(`Solicitação rejeitada: ${request.title}`);
    }
    // Se todas as aprovações necessárias foram obtidas, aprovar
    else if (pendingApprovals.length === 0 && approvedCount > 0) {
      request.status = 'approved';
      toast.success(`Solicitação aprovada: ${request.title}`);
      
      // Executar ação aprovada
      await this.executeApprovedAction(request);
    }
    // Ainda pendente
    else {
      toast.info(`Aprovação registrada. Aguardando ${pendingApprovals.length} aprovação(ões) restante(s).`);
    }

    this.saveRequests();
  }

  // Cancelar solicitação
  async cancelRequest(requestId: string, cancelledBy: string): Promise<void> {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Solicitação não encontrada');
    }

    if (request.requestedBy !== cancelledBy) {
      throw new Error('Apenas quem solicitou pode cancelar a aprovação');
    }

    if (request.status !== 'pending') {
      throw new Error('Não é possível cancelar uma solicitação já processada');
    }

    request.status = 'cancelled';
    request.updatedAt = new Date();
    this.saveRequests();

    toast.info(`Solicitação cancelada: ${request.title}`);
  }

  // Executar ação aprovada
  private async executeApprovedAction(request: ApprovalRequest): Promise<void> {
    // Esta função seria chamada para executar a ação aprovada
    // Por exemplo, atualizar o projeto no banco de dados
    console.log('Executando ação aprovada:', request);
    
    // Aqui você integraria com o store principal para aplicar as mudanças
    // Exemplo: updateProject(request.projectId, request.proposedValue)
  }

  // Determinar aprovadores necessários
  private determineApprovers(rules: ApprovalRule[]): Array<{id: string, name: string, role: string}> {
    // Simulação - em produção, isso viria do sistema de colaboradores
    const mockApprovers = [
      { id: 'mgmt-1', name: 'João Silva', role: 'management' },
      { id: 'exec-1', name: 'Maria Santos', role: 'executive' },
      { id: 'ops-1', name: 'Pedro Costa', role: 'operations' },
      { id: 'fin-1', name: 'Ana Oliveira', role: 'finance' }
    ];

    const requiredApprovers = new Set<string>();
    
    for (const rule of rules) {
      for (const approver of rule.approvers) {
        if (approver.required) {
          const matchingApprovers = mockApprovers.filter(a => a.role === approver.role);
          matchingApprovers.forEach(a => requiredApprovers.add(a.id));
        }
      }
    }

    return mockApprovers.filter(a => requiredApprovers.has(a.id));
  }

  // Encontrar regras aplicáveis
  private getApplicableRules(type: ApprovalRequest['type'], data: any): ApprovalRule[] {
    return this.rules.filter(rule => {
      if (!rule.enabled || rule.type !== type) return false;

      // Verificar condições específicas
      if (type === 'budget_change' && rule.conditions.budgetThreshold) {
        const budgetChange = Math.abs(data.proposedValue - data.currentValue);
        return budgetChange >= rule.conditions.budgetThreshold;
      }

      if (type === 'timeline_change' && rule.conditions.timelineChangeThreshold) {
        const timelineChange = Math.abs(
          new Date(data.proposedValue).getTime() - new Date(data.currentValue).getTime()
        ) / (1000 * 60 * 60 * 24); // dias
        return timelineChange >= rule.conditions.timelineChangeThreshold;
      }

      return true;
    });
  }

  // Notificar aprovadores
  private notifyApprovers(request: ApprovalRequest): void {
    // Aqui você integraria com o sistema de notificações
    console.log('Notificando aprovadores:', request.approvers);
  }

  // Getters
  getRequests(): ApprovalRequest[] {
    return this.requests;
  }

  getPendingRequests(): ApprovalRequest[] {
    return this.requests.filter(r => r.status === 'pending');
  }

  getRequestsForApprover(approverId: string): ApprovalRequest[] {
    return this.requests.filter(r => 
      r.status === 'pending' && 
      r.approvals.some(a => a.approverId === approverId && a.status === 'pending')
    );
  }

  getRequestsByProject(projectId: string): ApprovalRequest[] {
    return this.requests.filter(r => r.projectId === projectId);
  }

  getRules(): ApprovalRule[] {
    return this.rules;
  }

  // Configuração de regras
  updateRule(ruleId: string, updates: Partial<ApprovalRule>): void {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex >= 0) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
      this.saveRules();
    }
  }

  addCustomRule(rule: ApprovalRule): void {
    this.rules.push(rule);
    this.saveRules();
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
    this.saveRules();
  }

  // Utilitários
  private generateId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // Persistência
  private loadRequests(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('caaqui_approval_requests');
      if (saved) {
        this.requests = JSON.parse(saved).map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
          deadline: r.deadline ? new Date(r.deadline) : undefined,
          approvals: r.approvals.map((a: any) => ({
            ...a,
            timestamp: a.timestamp ? new Date(a.timestamp) : undefined
          }))
        }));
      }
    } catch {
      this.requests = [];
    }
  }

  private saveRequests(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('caaqui_approval_requests', JSON.stringify(this.requests));
    } catch (error) {
      console.warn('Erro ao salvar solicitações de aprovação:', error);
    }
  }

  private loadRules(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('caaqui_approval_rules');
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
      localStorage.setItem('caaqui_approval_rules', JSON.stringify(this.rules));
    } catch (error) {
      console.warn('Erro ao salvar regras de aprovação:', error);
    }
  }
}

// Instância singleton
export const approvalService = new ApprovalService();

// Hook para usar no React
export function useApprovals() {
  return {
    requests: approvalService.getRequests(),
    pendingRequests: approvalService.getPendingRequests(),
    rules: approvalService.getRules(),
    createRequest: (type: ApprovalRequest['type'], projectId: string, projectName: string, requestedBy: string, requestedByName: string, data: any) =>
      approvalService.createApprovalRequest(type, projectId, projectName, requestedBy, requestedByName, data),
    processApproval: (requestId: string, approverId: string, status: 'approved' | 'rejected', comment?: string) =>
      approvalService.processApproval(requestId, approverId, status, comment),
    cancelRequest: (requestId: string, cancelledBy: string) =>
      approvalService.cancelRequest(requestId, cancelledBy),
    getRequestsForApprover: (approverId: string) =>
      approvalService.getRequestsForApprover(approverId),
    getRequestsByProject: (projectId: string) =>
      approvalService.getRequestsByProject(projectId),
    updateRule: (ruleId: string, updates: Partial<ApprovalRule>) =>
      approvalService.updateRule(ruleId, updates),
    addCustomRule: (rule: ApprovalRule) => approvalService.addCustomRule(rule),
    removeRule: (ruleId: string) => approvalService.removeRule(ruleId)
  };
}
