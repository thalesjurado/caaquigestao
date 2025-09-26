// Templates de projeto com tarefas padrão

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: 'tech' | 'growth';
  estimatedDuration: number; // dias
  defaultTasks: {
    title: string;
    description?: string;
    status: 'backlog' | 'todo' | 'doing' | 'done';
    estimatedDays?: number;
    dependencies?: string[]; // títulos de outras tarefas
  }[];
  requiredRoles: string[];
  techDetails?: {
    platform?: string;
    integrations?: string[];
    martechTools?: string[];
  };
  growthDetails?: {
    campaignType?: string;
    expectedResults?: string;
  };
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tech-implementation-basic',
    name: 'Implementação Técnica Básica',
    description: 'Template para projetos de implementação técnica padrão',
    type: 'tech',
    estimatedDuration: 45,
    requiredRoles: ['Tech Lead', 'Desenvolvedor', 'QA'],
    defaultTasks: [
      {
        title: 'Análise de Requisitos',
        description: 'Levantamento detalhado dos requisitos técnicos',
        status: 'todo',
        estimatedDays: 3
      },
      {
        title: 'Arquitetura da Solução',
        description: 'Definição da arquitetura e tecnologias',
        status: 'todo',
        estimatedDays: 5,
        dependencies: ['Análise de Requisitos']
      },
      {
        title: 'Setup do Ambiente',
        description: 'Configuração dos ambientes de desenvolvimento e produção',
        status: 'todo',
        estimatedDays: 2,
        dependencies: ['Arquitetura da Solução']
      },
      {
        title: 'Desenvolvimento - Backend',
        description: 'Implementação das APIs e lógica de negócio',
        status: 'todo',
        estimatedDays: 15,
        dependencies: ['Setup do Ambiente']
      },
      {
        title: 'Desenvolvimento - Frontend',
        description: 'Implementação da interface do usuário',
        status: 'todo',
        estimatedDays: 12,
        dependencies: ['Desenvolvimento - Backend']
      },
      {
        title: 'Testes Unitários',
        description: 'Criação e execução de testes unitários',
        status: 'todo',
        estimatedDays: 5,
        dependencies: ['Desenvolvimento - Backend', 'Desenvolvimento - Frontend']
      },
      {
        title: 'Testes de Integração',
        description: 'Testes de integração entre componentes',
        status: 'todo',
        estimatedDays: 3,
        dependencies: ['Testes Unitários']
      },
      {
        title: 'Deploy e Homologação',
        description: 'Deploy em ambiente de homologação e testes',
        status: 'todo',
        estimatedDays: 2,
        dependencies: ['Testes de Integração']
      },
      {
        title: 'Deploy Produção',
        description: 'Deploy final em produção',
        status: 'todo',
        estimatedDays: 1,
        dependencies: ['Deploy e Homologação']
      },
      {
        title: 'Documentação',
        description: 'Documentação técnica e manual do usuário',
        status: 'todo',
        estimatedDays: 3,
        dependencies: ['Deploy Produção']
      }
    ],
    techDetails: {
      platform: 'Web',
      integrations: ['API REST', 'Banco de Dados'],
      martechTools: []
    }
  },
  {
    id: 'growth-campaign-basic',
    name: 'Campanha de Growth Básica',
    description: 'Template para campanhas de growth marketing',
    type: 'growth',
    estimatedDuration: 30,
    requiredRoles: ['Growth Manager', 'Designer', 'Copywriter'],
    defaultTasks: [
      {
        title: 'Briefing e Objetivos',
        description: 'Definição dos objetivos e KPIs da campanha',
        status: 'todo',
        estimatedDays: 2
      },
      {
        title: 'Pesquisa de Mercado',
        description: 'Análise da concorrência e público-alvo',
        status: 'todo',
        estimatedDays: 3,
        dependencies: ['Briefing e Objetivos']
      },
      {
        title: 'Estratégia de Conteúdo',
        description: 'Definição da estratégia e calendário de conteúdo',
        status: 'todo',
        estimatedDays: 4,
        dependencies: ['Pesquisa de Mercado']
      },
      {
        title: 'Criação de Assets',
        description: 'Criação de materiais visuais e textos',
        status: 'todo',
        estimatedDays: 8,
        dependencies: ['Estratégia de Conteúdo']
      },
      {
        title: 'Setup de Campanhas',
        description: 'Configuração das campanhas nas plataformas',
        status: 'todo',
        estimatedDays: 3,
        dependencies: ['Criação de Assets']
      },
      {
        title: 'Testes A/B',
        description: 'Configuração e execução de testes A/B',
        status: 'todo',
        estimatedDays: 5,
        dependencies: ['Setup de Campanhas']
      },
      {
        title: 'Lançamento',
        description: 'Lançamento oficial da campanha',
        status: 'todo',
        estimatedDays: 1,
        dependencies: ['Testes A/B']
      },
      {
        title: 'Monitoramento',
        description: 'Acompanhamento diário dos resultados',
        status: 'todo',
        estimatedDays: 7,
        dependencies: ['Lançamento']
      },
      {
        title: 'Otimização',
        description: 'Ajustes baseados nos resultados',
        status: 'todo',
        estimatedDays: 5,
        dependencies: ['Monitoramento']
      },
      {
        title: 'Relatório Final',
        description: 'Análise final dos resultados e aprendizados',
        status: 'todo',
        estimatedDays: 2,
        dependencies: ['Otimização']
      }
    ],
    growthDetails: {
      campaignType: 'Digital Marketing',
      expectedResults: 'Aumento de conversões e engajamento'
    }
  },
  {
    id: 'tech-integration-advanced',
    name: 'Integração Técnica Avançada',
    description: 'Template para projetos de integração complexa',
    type: 'tech',
    estimatedDuration: 60,
    requiredRoles: ['Tech Lead', 'Desenvolvedor Senior', 'DevOps', 'QA'],
    defaultTasks: [
      {
        title: 'Análise de Sistemas Existentes',
        description: 'Mapeamento dos sistemas a serem integrados',
        status: 'todo',
        estimatedDays: 5
      },
      {
        title: 'Definição de APIs',
        description: 'Especificação das APIs de integração',
        status: 'todo',
        estimatedDays: 7,
        dependencies: ['Análise de Sistemas Existentes']
      },
      {
        title: 'Prototipagem',
        description: 'Desenvolvimento de protótipo da integração',
        status: 'todo',
        estimatedDays: 10,
        dependencies: ['Definição de APIs']
      },
      {
        title: 'Desenvolvimento - Conectores',
        description: 'Implementação dos conectores entre sistemas',
        status: 'todo',
        estimatedDays: 20,
        dependencies: ['Prototipagem']
      },
      {
        title: 'Testes de Conectividade',
        description: 'Testes de conexão entre todos os sistemas',
        status: 'todo',
        estimatedDays: 8,
        dependencies: ['Desenvolvimento - Conectores']
      },
      {
        title: 'Monitoramento e Logs',
        description: 'Implementação de sistema de monitoramento',
        status: 'todo',
        estimatedDays: 5,
        dependencies: ['Testes de Conectividade']
      },
      {
        title: 'Testes de Carga',
        description: 'Testes de performance e escalabilidade',
        status: 'todo',
        estimatedDays: 3,
        dependencies: ['Monitoramento e Logs']
      },
      {
        title: 'Deploy Gradual',
        description: 'Deploy em fases para minimizar riscos',
        status: 'todo',
        estimatedDays: 2,
        dependencies: ['Testes de Carga']
      }
    ],
    techDetails: {
      platform: 'Multi-platform',
      integrations: ['API REST', 'Webhooks', 'Message Queue'],
      martechTools: ['CDP', 'CRM', 'Analytics']
    }
  }
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByType(type: 'tech' | 'growth'): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter(template => template.type === type);
}

export function createProjectFromTemplate(
  template: ProjectTemplate,
  projectName: string,
  client: string,
  startDate: Date = new Date()
): {
  project: Omit<import('./types').Project, 'id' | 'allocations'>;
  tasks: Omit<import('./store-supabase').BoardActivity, 'id'>[];
} {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + template.estimatedDuration);

  const project: Omit<import('./types').Project, 'id' | 'allocations'> = {
    name: projectName,
    client,
    type: template.type,
    status: 'planning',
    startDate,
    endDate,
    description: template.description,
    techDetails: template.techDetails,
    growthDetails: template.growthDetails,
  };

  const tasks: Omit<import('./store-supabase').BoardActivity, 'id'>[] = template.defaultTasks.map(task => ({
    title: task.title,
    status: task.status,
    description: task.description,
    client,
  }));

  return { project, tasks };
}
