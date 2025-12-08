// Sistema de Relatórios Automáticos para Clientes
import { Project, ProjectAllocation } from './types';
import { Collaborator, BoardActivity } from './store-supabase';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'weekly' | 'monthly' | 'milestone' | 'custom';
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'on_demand';
  enabled: boolean;
  clients: string[]; // Lista de clientes que recebem este relatório
  sections: ReportSection[];
  format: 'html' | 'pdf' | 'json';
  autoSend: boolean;
  recipients: string[]; // emails
  lastGenerated?: Date;
  nextScheduled?: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'project_status' | 'timeline' | 'budget' | 'team' | 'milestones' | 'risks' | 'custom_text';
  enabled: boolean;
  config: {
    includeCharts?: boolean;
    showDetails?: boolean;
    customText?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  client: string;
  title: string;
  period: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
  generatedBy: string;
  format: 'html' | 'pdf' | 'json';
  content: ReportContent;
  status: 'draft' | 'sent' | 'viewed';
  recipients: string[];
  downloadUrl?: string;
}

export interface ReportContent {
  summary: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    onTimeProjects: number;
    delayedProjects: number;
    totalBudget: number;
    spentBudget: number;
  };
  projects: ProjectReportData[];
  team: {
    totalMembers: number;
    utilization: number;
    topPerformers: string[];
  };
  timeline: {
    upcomingMilestones: any[];
    recentCompletions: any[];
  };
  risks: {
    high: any[];
    medium: any[];
    low: any[];
  };
  customSections?: any[];
}

export interface ProjectReportData {
  id: string;
  name: string;
  client: string;
  status: string;
  progress: number;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  team: {
    members: number;
    utilization: number;
  };
  milestones: {
    completed: number;
    total: number;
    upcoming: any[];
  };
  risks: string[];
  highlights: string[];
}

class ReportService {
  private templates: ReportTemplate[] = [];
  private reports: GeneratedReport[] = [];

  constructor() {
    this.loadTemplates();
    this.loadReports();
  }

  // Templates padrão
  getDefaultTemplates(): ReportTemplate[] {
    return [
      {
        id: 'weekly-status',
        name: 'Status Semanal',
        description: 'Relatório semanal com status dos projetos ativos',
        type: 'weekly',
        frequency: 'weekly',
        enabled: true,
        clients: [],
        format: 'html',
        autoSend: true,
        recipients: [],
        sections: [
          {
            id: 'summary',
            title: 'Resumo Executivo',
            type: 'project_status',
            enabled: true,
            config: { includeCharts: true, showDetails: false }
          },
          {
            id: 'projects',
            title: 'Status dos Projetos',
            type: 'project_status',
            enabled: true,
            config: { includeCharts: false, showDetails: true }
          },
          {
            id: 'timeline',
            title: 'Cronograma',
            type: 'timeline',
            enabled: true,
            config: { includeCharts: true }
          },
          {
            id: 'risks',
            title: 'Riscos e Alertas',
            type: 'risks',
            enabled: true,
            config: { showDetails: true }
          }
        ]
      },
      {
        id: 'monthly-executive',
        name: 'Relatório Executivo Mensal',
        description: 'Relatório mensal completo para executivos',
        type: 'monthly',
        frequency: 'monthly',
        enabled: true,
        clients: [],
        format: 'pdf',
        autoSend: true,
        recipients: [],
        sections: [
          {
            id: 'executive-summary',
            title: 'Resumo Executivo',
            type: 'project_status',
            enabled: true,
            config: { includeCharts: true, showDetails: false }
          },
          {
            id: 'budget-analysis',
            title: 'Análise Orçamentária',
            type: 'budget',
            enabled: true,
            config: { includeCharts: true, showDetails: true }
          },
          {
            id: 'team-performance',
            title: 'Performance da Equipe',
            type: 'team',
            enabled: true,
            config: { includeCharts: true }
          },
          {
            id: 'milestones',
            title: 'Marcos e Entregas',
            type: 'milestones',
            enabled: true,
            config: { showDetails: true }
          }
        ]
      },
      {
        id: 'project-milestone',
        name: 'Relatório de Marco',
        description: 'Relatório gerado automaticamente quando um marco é atingido',
        type: 'milestone',
        frequency: 'on_demand',
        enabled: true,
        clients: [],
        format: 'html',
        autoSend: true,
        recipients: [],
        sections: [
          {
            id: 'milestone-summary',
            title: 'Marco Atingido',
            type: 'milestones',
            enabled: true,
            config: { showDetails: true }
          },
          {
            id: 'next-steps',
            title: 'Próximos Passos',
            type: 'timeline',
            enabled: true,
            config: { showDetails: true }
          }
        ]
      }
    ];
  }

  // Gerar relatório
  async generateReport(
    templateId: string,
    client: string,
    period: { start: Date; end: Date },
    projects: Project[],
    collaborators: Collaborator[],
    allocations: ProjectAllocation[],
    activities: BoardActivity[]
  ): Promise<GeneratedReport> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    // Filtrar dados por cliente e período
    const clientProjects = projects.filter(p => 
      p.client === client &&
      new Date(p.startDate) <= period.end &&
      new Date(p.endDate) >= period.start
    );

    const clientActivities = activities.filter(a => a.client === client);

    // Gerar conteúdo do relatório
    const content = await this.generateReportContent(
      template,
      clientProjects,
      collaborators,
      allocations,
      clientActivities,
      period
    );

    const report: GeneratedReport = {
      id: this.generateId(),
      templateId: template.id,
      templateName: template.name,
      client,
      title: `${template.name} - ${client} (${period.start.toLocaleDateString('pt-BR')} a ${period.end.toLocaleDateString('pt-BR')})`,
      period,
      generatedAt: new Date(),
      generatedBy: 'Sistema', // Em produção, viria do usuário logado
      format: template.format,
      content,
      status: 'draft',
      recipients: template.recipients
    };

    this.reports.unshift(report);
    this.saveReports();

    return report;
  }

  // Gerar conteúdo do relatório
  private async generateReportContent(
    template: ReportTemplate,
    projects: Project[],
    collaborators: Collaborator[],
    allocations: ProjectAllocation[],
    activities: BoardActivity[],
    period: { start: Date; end: Date }
  ): Promise<ReportContent> {
    const now = new Date();
    
    // Calcular métricas gerais
    const activeProjects = projects.filter(p => p.status === 'active');
    const completedProjects = projects.filter(p => p.status === 'completed');
    const onTimeProjects = projects.filter(p => 
      p.status === 'completed' && new Date(p.endDate) >= now
    );
    const delayedProjects = projects.filter(p => 
      p.status === 'active' && new Date(p.endDate) < now
    );

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const spentBudget = totalBudget * 0.7; // Simulação - em produção viria de time tracking

    // Gerar dados detalhados dos projetos
    const projectsData: ProjectReportData[] = projects.map(project => {
      const projectActivities = activities.filter(a => a.projectId === project.id);
      const completedActivities = projectActivities.filter(a => a.status === 'done');
      const progress = projectActivities.length > 0 
        ? (completedActivities.length / projectActivities.length) * 100 
        : 0;

      const projectAllocations = allocations.filter(a => a.projectId === project.id);
      const teamMembers = projectAllocations.length;
      const avgUtilization = teamMembers > 0
        ? projectAllocations.reduce((sum, a) => sum + a.percentage, 0) / teamMembers
        : 0;

      return {
        id: project.id,
        name: project.name,
        client: project.client,
        status: project.status,
        progress: Math.round(progress),
        startDate: new Date(project.startDate),
        endDate: new Date(project.endDate),
        budget: project.budget || 0,
        spent: (project.budget || 0) * (progress / 100),
        team: {
          members: teamMembers,
          utilization: Math.round(avgUtilization)
        },
        milestones: {
          completed: completedActivities.length,
          total: projectActivities.length,
          upcoming: projectActivities
            .filter(a => a.status !== 'done' && a.dueDate)
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
            .slice(0, 3)
        },
        risks: this.identifyProjectRisks(project, projectActivities),
        highlights: this.generateProjectHighlights(project, projectActivities, period)
      };
    });

    // Identificar riscos
    const risks = {
      high: projects.filter(p => 
        p.status === 'active' && new Date(p.endDate) < now
      ).map(p => `Projeto ${p.name} em atraso`),
      medium: projects.filter(p => {
        const daysToDeadline = Math.ceil(
          (new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return p.status === 'active' && daysToDeadline <= 7 && daysToDeadline > 0;
      }).map(p => `Projeto ${p.name} com prazo próximo`),
      low: []
    };

    return {
      summary: {
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        onTimeProjects: onTimeProjects.length,
        delayedProjects: delayedProjects.length,
        totalBudget,
        spentBudget
      },
      projects: projectsData,
      team: {
        totalMembers: collaborators.length,
        utilization: Math.round(
          allocations.reduce((sum, a) => sum + a.percentage, 0) / Math.max(collaborators.length, 1)
        ),
        topPerformers: collaborators.slice(0, 3).map(c => c.name)
      },
      timeline: {
        upcomingMilestones: activities
          .filter(a => a.dueDate && new Date(a.dueDate) > now)
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
          .slice(0, 5),
        recentCompletions: activities
          .filter(a => a.status === 'done' && a.createdAt && new Date(a.createdAt) >= period.start)
          .slice(0, 5)
      },
      risks
    };
  }

  // Identificar riscos do projeto
  private identifyProjectRisks(project: Project, activities: BoardActivity[]): string[] {
    const risks: string[] = [];
    const now = new Date();
    
    if (project.status === 'active' && new Date(project.endDate) < now) {
      risks.push('Projeto em atraso');
    }
    
    const overdueTasks = activities.filter(a => 
      a.status !== 'done' && a.dueDate && new Date(a.dueDate) < now
    );
    
    if (overdueTasks.length > 0) {
      risks.push(`${overdueTasks.length} tarefa(s) em atraso`);
    }
    
    const progress = activities.length > 0 
      ? (activities.filter(a => a.status === 'done').length / activities.length) * 100 
      : 0;
    
    if (progress < 50 && project.status === 'active') {
      const daysToDeadline = Math.ceil(
        (new Date(project.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysToDeadline < 30) {
        risks.push('Baixo progresso próximo ao prazo');
      }
    }
    
    return risks;
  }

  // Gerar destaques do projeto
  private generateProjectHighlights(
    project: Project, 
    activities: BoardActivity[], 
    period: { start: Date; end: Date }
  ): string[] {
    const highlights: string[] = [];
    
    const recentCompletions = activities.filter(a => 
      a.status === 'done' && 
      a.createdAt && 
      new Date(a.createdAt) >= period.start &&
      new Date(a.createdAt) <= period.end
    );
    
    if (recentCompletions.length > 0) {
      highlights.push(`${recentCompletions.length} tarefa(s) concluída(s) no período`);
    }
    
    if (project.status === 'completed') {
      highlights.push('Projeto concluído com sucesso');
    }
    
    return highlights;
  }

  // Exportar relatório para HTML
  exportToHTML(report: GeneratedReport): string {
    const { content } = report;
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #1f2937; font-size: 28px; font-weight: bold; margin: 0; }
        .subtitle { color: #6b7280; font-size: 16px; margin: 5px 0 0 0; }
        .section { margin-bottom: 30px; }
        .section-title { color: #1f2937; font-size: 20px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 15px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .summary-card { background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; }
        .summary-number { font-size: 24px; font-weight: bold; color: #1f2937; }
        .summary-label { color: #6b7280; font-size: 14px; }
        .project-card { background: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 15px; }
        .project-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
        .project-name { font-weight: bold; font-size: 18px; color: #1f2937; }
        .project-status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-active { background: #dbeafe; color: #1e40af; }
        .status-completed { background: #dcfce7; color: #166534; }
        .progress-bar { background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .progress-fill { background: #3b82f6; height: 100%; transition: width 0.3s ease; }
        .risk-high { color: #dc2626; font-weight: bold; }
        .risk-medium { color: #d97706; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${report.title}</h1>
            <p class="subtitle">Gerado em ${report.generatedAt.toLocaleDateString('pt-BR')} às ${report.generatedAt.toLocaleTimeString('pt-BR')}</p>
        </div>

        <div class="section">
            <h2 class="section-title">Resumo Executivo</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-number">${content.summary.totalProjects}</div>
                    <div class="summary-label">Total de Projetos</div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${content.summary.activeProjects}</div>
                    <div class="summary-label">Projetos Ativos</div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${content.summary.completedProjects}</div>
                    <div class="summary-label">Projetos Concluídos</div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(content.summary.totalBudget)}</div>
                    <div class="summary-label">Orçamento Total</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Status dos Projetos</h2>
            ${content.projects.map(project => `
                <div class="project-card">
                    <div class="project-header">
                        <span class="project-name">${project.name}</span>
                        <span class="project-status status-${project.status}">${project.status}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                    <p><strong>Progresso:</strong> ${project.progress}%</p>
                    <p><strong>Equipe:</strong> ${project.team.members} membro(s)</p>
                    <p><strong>Orçamento:</strong> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.budget)}</p>
                    ${project.risks.length > 0 ? `<p><strong>Riscos:</strong> <span class="risk-high">${project.risks.join(', ')}</span></p>` : ''}
                    ${project.highlights.length > 0 ? `<p><strong>Destaques:</strong> ${project.highlights.join(', ')}</p>` : ''}
                </div>
            `).join('')}
        </div>

        ${content.risks.high.length > 0 || content.risks.medium.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Riscos e Alertas</h2>
            ${content.risks.high.length > 0 ? `
                <h3 class="risk-high">Riscos Altos</h3>
                <ul>${content.risks.high.map(risk => `<li class="risk-high">${risk}</li>`).join('')}</ul>
            ` : ''}
            ${content.risks.medium.length > 0 ? `
                <h3 class="risk-medium">Riscos Médios</h3>
                <ul>${content.risks.medium.map(risk => `<li class="risk-medium">${risk}</li>`).join('')}</ul>
            ` : ''}
        </div>
        ` : ''}

        <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema Caaqui ProjectOps</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Agendar relatórios automáticos
  scheduleAutomaticReports(): void {
    // Esta função seria chamada por um cron job ou scheduler
    const now = new Date();
    
    this.templates
      .filter(t => t.enabled && t.autoSend)
      .forEach(template => {
        if (this.shouldGenerateReport(template, now)) {
          // Gerar relatório para cada cliente
          template.clients.forEach(client => {
            const period = this.calculateReportPeriod(template.frequency, now);
            // Aqui você chamaria generateReport com os dados necessários
            console.log(`Agendando relatório ${template.name} para cliente ${client}`);
          });
        }
      });
  }

  private shouldGenerateReport(template: ReportTemplate, now: Date): boolean {
    if (!template.nextScheduled) return true;
    return now >= template.nextScheduled;
  }

  private calculateReportPeriod(frequency: string, now: Date): { start: Date; end: Date } {
    const end = new Date(now);
    const start = new Date(now);
    
    switch (frequency) {
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(start.getMonth() - 3);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }
    
    return { start, end };
  }

  // Getters
  getTemplates(): ReportTemplate[] {
    return this.templates;
  }

  getReports(): GeneratedReport[] {
    return this.reports;
  }

  getReportsByClient(client: string): GeneratedReport[] {
    return this.reports.filter(r => r.client === client);
  }

  getReport(id: string): GeneratedReport | undefined {
    return this.reports.find(r => r.id === id);
  }

  // CRUD Templates
  updateTemplate(id: string, updates: Partial<ReportTemplate>): void {
    const index = this.templates.findIndex(t => t.id === id);
    if (index >= 0) {
      this.templates[index] = { ...this.templates[index], ...updates };
      this.saveTemplates();
    }
  }

  addTemplate(template: ReportTemplate): void {
    this.templates.push(template);
    this.saveTemplates();
  }

  deleteTemplate(id: string): void {
    this.templates = this.templates.filter(t => t.id !== id);
    this.saveTemplates();
  }

  // Marcar relatório como enviado
  markReportAsSent(id: string): void {
    const report = this.reports.find(r => r.id === id);
    if (report) {
      report.status = 'sent';
      this.saveReports();
    }
  }

  // Utilitários
  private generateId(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // Persistência
  private loadTemplates(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('caaqui_report_templates');
      if (saved) {
        this.templates = JSON.parse(saved);
      } else {
        this.templates = this.getDefaultTemplates();
        this.saveTemplates();
      }
    } catch {
      this.templates = this.getDefaultTemplates();
    }
  }

  private saveTemplates(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('caaqui_report_templates', JSON.stringify(this.templates));
    } catch (error) {
      console.warn('Erro ao salvar templates de relatório:', error);
    }
  }

  private loadReports(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('caaqui_generated_reports');
      if (saved) {
        this.reports = JSON.parse(saved).map((r: any) => ({
          ...r,
          period: {
            start: new Date(r.period.start),
            end: new Date(r.period.end)
          },
          generatedAt: new Date(r.generatedAt)
        }));
      }
    } catch {
      this.reports = [];
    }
  }

  private saveReports(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('caaqui_generated_reports', JSON.stringify(this.reports));
    } catch (error) {
      console.warn('Erro ao salvar relatórios gerados:', error);
    }
  }
}

// Instância singleton
export const reportService = new ReportService();

// Hook para usar no React
export function useReports() {
  return {
    templates: reportService.getTemplates(),
    reports: reportService.getReports(),
    generateReport: (templateId: string, client: string, period: any, projects: any, collaborators: any, allocations: any, activities: any) =>
      reportService.generateReport(templateId, client, period, projects, collaborators, allocations, activities),
    exportToHTML: (report: GeneratedReport) => reportService.exportToHTML(report),
    getReportsByClient: (client: string) => reportService.getReportsByClient(client),
    getReport: (id: string) => reportService.getReport(id),
    updateTemplate: (id: string, updates: Partial<ReportTemplate>) => reportService.updateTemplate(id, updates),
    addTemplate: (template: ReportTemplate) => reportService.addTemplate(template),
    deleteTemplate: (id: string) => reportService.deleteTemplate(id),
    markReportAsSent: (id: string) => reportService.markReportAsSent(id)
  };
}
