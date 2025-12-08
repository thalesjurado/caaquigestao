'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '../../lib/store-supabase';

type DeOpsModule = 'home' | 'playbooks' | 'produtos' | 'clientes' | 'projetos' | 'governanca' | 'dados' | 'time';

export default function DeOps() {
  const [activeModule, setActiveModule] = useState<DeOpsModule>('home');
  const [clientFilter, setClientFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [isCreatingSprint, setIsCreatingSprint] = useState<boolean>(false);
  const [newSprintName, setNewSprintName] = useState<string>('');
  const [newSprintObjective, setNewSprintObjective] = useState<string>('');
  const [newSprintStart, setNewSprintStart] = useState<string>('');
  const [newSprintEnd, setNewSprintEnd] = useState<string>('');

  const [newEntryTitle, setNewEntryTitle] = useState<string>('');
  const [newEntryCollaboratorId, setNewEntryCollaboratorId] = useState<string>('');
  const [newEntryStatus, setNewEntryStatus] = useState<string>('todo');
  const [newEntryPlannedHours, setNewEntryPlannedHours] = useState<string>('');
  const [newEntryReason, setNewEntryReason] = useState<string>('');

  const { projects, sprints, sprintEntries, collaborators, projectAllocations, addSprint, addSprintEntry } = useAppStore();

  const projectsByClient = useMemo(() => {
    const groups = new Map<string, { id: string; name: string }[]>();
    projects.forEach(project => {
      const client = project.client || 'Sem cliente';
      if (!groups.has(client)) groups.set(client, []);
      groups.get(client)!.push({ id: project.id, name: project.name });
    });
    return Array.from(groups.entries()).map(([client, list]) => ({ client, projects: list }));
  }, [projects]);

  const filteredSprints = useMemo(() => {
    if (!selectedProjectId) return [] as typeof sprints;
    const list = sprints.filter(s => s.projectId === selectedProjectId);
    return [...list].sort((a, b) => {
      const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aDate - bDate;
    });
  }, [sprints, selectedProjectId]);

  const visibleSprintEntries = useMemo(() => {
    if (!selectedSprintId) return [] as typeof sprintEntries;
    return sprintEntries.filter(e => e.sprintId === selectedSprintId);
  }, [sprintEntries, selectedSprintId]);

  const selectedProjectHoursSummary = useMemo(() => {
    if (!selectedProjectId) return null as null | {
      totalByType: Record<string, number>;
      byCollaborator: {
        collaboratorId: string;
        collaboratorName: string;
        byType: Record<string, number>;
      }[];
    };

    const allocations = projectAllocations.filter(a => a.projectId === selectedProjectId);
    const totalByType: Record<string, number> = {};
    const collaboratorMap = new Map<string, { collaboratorId: string; collaboratorName: string; byType: Record<string, number> }>();

    allocations.forEach(a => {
      const type = a.hourType || 'billable';
      const hours = a.plannedHoursMonthly || 0;

      totalByType[type] = (totalByType[type] || 0) + hours;

      const collId = a.collaboratorId;
      if (!collaboratorMap.has(collId)) {
        const coll = collaborators.find(c => c.id === collId);
        collaboratorMap.set(collId, {
          collaboratorId: collId,
          collaboratorName: coll?.name || 'Sem nome',
          byType: {},
        });
      }
      const entry = collaboratorMap.get(collId)!;
      entry.byType[type] = (entry.byType[type] || 0) + hours;
    });

    return {
      totalByType,
      byCollaborator: Array.from(collaboratorMap.values()),
    };
  }, [selectedProjectId, projectAllocations, collaborators]);

  const ModuleBtn = ({ id, label, icon }: { id: DeOpsModule; label: string; icon: string }) => (
    <button
      onClick={() => setActiveModule(id)}
      className={`p-4 rounded-lg border text-left transition-all duration-200 ${
        activeModule === id
          ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold">{label}</div>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ DeOps Caaqui</h1>
        <p className="text-gray-600">Sistema Central de Operação da Caaqui</p>
      </div>

      {activeModule === 'home' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">📌 Sobre o DeOps</h2>
            <p className="text-blue-800">
              O DeOps da Caaqui é o sistema central de operação da empresa. Sua função é padronizar o trabalho, 
              escalar a operação com qualidade, reduzir dependência dos sócios, garantir consistência, 
              acelerar onboardings e dar previsibilidade aos clientes.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-3">⚡ Atalhos Rápidos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div 
                onClick={() => {
                  console.log('Navegando para aba principal de Projetos - Criar Projeto');
                  if (typeof window !== 'undefined') {
                    window.location.hash = '#projects';
                  }
                }}
                className="bg-white border border-green-300 text-green-800 px-3 py-2 rounded hover:bg-green-100 transition-colors cursor-pointer select-none"
                role="button"
                tabIndex={0}
              >
                ➕ Criar Projeto
              </div>
              <div 
                onClick={() => {
                  console.log('Navegando para Projetos - Iniciar Sprint');
                  setActiveModule('projetos');
                  setIsCreatingSprint(true);
                }}
                className="bg-white border border-green-300 text-green-800 px-3 py-2 rounded hover:bg-green-100 transition-colors cursor-pointer select-none"
                role="button"
                tabIndex={0}
              >
                🚀 Iniciar Sprint
              </div>
              <div 
                onClick={() => {
                  console.log('Navegando para Clientes - Criar Diagnóstico');
                  setActiveModule('clientes');
                }}
                className="bg-white border border-green-300 text-green-800 px-3 py-2 rounded hover:bg-green-100 transition-colors cursor-pointer select-none"
                role="button"
                tabIndex={0}
              >
                🔍 Criar Diagnóstico
              </div>
              <div 
                onClick={() => {
                  console.log('Navegando para Time - Abrir RACI');
                  setActiveModule('time');
                }}
                className="bg-white border border-green-300 text-green-800 px-3 py-2 rounded hover:bg-green-100 transition-colors cursor-pointer select-none"
                role="button"
                tabIndex={0}
              >
                📋 Abrir RACI
              </div>
              <div 
                onClick={() => {
                  console.log('Navegando para Clientes - Onboarding');
                  setActiveModule('clientes');
                }}
                className="bg-white border border-green-300 text-green-800 px-3 py-2 rounded hover:bg-green-100 transition-colors cursor-pointer select-none"
                role="button"
                tabIndex={0}
              >
                👥 Onboarding Cliente
              </div>
              <div 
                onClick={() => {
                  console.log('Navegando para Projetos - Weekly Report');
                  setActiveModule('projetos');
                }}
                className="bg-white border border-green-300 text-green-800 px-3 py-2 rounded hover:bg-green-100 transition-colors cursor-pointer select-none"
                role="button"
                tabIndex={0}
              >
                📊 Weekly Report
              </div>
              <div 
                onClick={() => {
                  console.log('Navegando para Dados - QA Checklist');
                  setActiveModule('dados');
                }}
                className="bg-white border border-green-300 text-green-800 px-3 py-2 rounded hover:bg-green-100 transition-colors cursor-pointer select-none"
                role="button"
                tabIndex={0}
              >
                🔧 QA Checklist
              </div>
              <div 
                onClick={() => {
                  console.log('Navegando para Projetos - Ver Métricas');
                  setActiveModule('projetos');
                }}
                className="bg-white border border-green-300 text-green-800 px-3 py-2 rounded hover:bg-green-100 transition-colors cursor-pointer select-none"
                role="button"
                tabIndex={0}
              >
                📈 Ver Métricas
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">📅 Últimas Atualizações</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sprint 47 - Cliente A: Jornadas de abandono em progresso</span>
                <span className="text-gray-500 ml-auto">Hoje</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Cliente B: Kickoff agendado para segunda-feira</span>
                <span className="text-gray-500 ml-auto">Ontem</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Cliente C: Diagnóstico 70% concluído</span>
                <span className="text-gray-500 ml-auto">2 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Cliente D: Bloqueio de acessos há 3 dias</span>
                <span className="text-gray-500 ml-auto">3 dias</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModuleBtn id="playbooks" label="Playbooks" icon="📚" />
            <ModuleBtn id="produtos" label="Produtos" icon="🚀" />
            <ModuleBtn id="clientes" label="Clientes" icon="👥" />
            <ModuleBtn id="projetos" label="Projetos" icon="📋" />
            <ModuleBtn id="governanca" label="Governança" icon="🏛️" />
            <ModuleBtn id="dados" label="Dados" icon="📊" />
            <ModuleBtn id="time" label="Time" icon="👨‍💼" />
          </div>
        </div>
      )}

      {activeModule === 'playbooks' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveModule('home')}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-bold">📚 Playbooks</h2>
          <p className="text-gray-600 mb-6">Processos padronizados para cada área da Caaqui</p>
          
          <div className="grid gap-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">🔧 Playbook Geral</h3>
              <p className="text-gray-600 mb-3">Padronização, eficiência e previsibilidade em toda operação</p>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Pilares:</strong> Qualidade, Consistência, Previsibilidade, Velocidade, Comunicação clara
              </div>
              <div className="text-sm bg-gray-50 p-3 rounded">
                <strong>SLAs Internos:</strong><br/>
                • Brief: 24h<br/>
                • Demandas pequenas: 48-72h<br/>
                • Demandas médias: 5 dias<br/>
                • Demandas grandes: sprint dedicada
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">📧 Playbook de CRM</h3>
              <p className="text-gray-600 mb-3">Metodologia CRM Caaqui em 5 etapas</p>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Etapas:</strong> Diagnóstico → Estruturação → Jornadas → Operação → Otimização
              </div>
              <div className="text-sm bg-gray-50 p-3 rounded">
                <strong>Calendário Padrão:</strong><br/>
                • Semana 1: Fluxos essenciais<br/>
                • Semana 2: Campanhas fixas<br/>
                • Semana 3: Testes e novas jornadas<br/>
                • Semana 4: Otimização e análise
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">🔗 Playbook de Martech</h3>
              <p className="text-gray-600 mb-3">Implementações de AppsFlyer, Adjust, Branch, GA4, GTM</p>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Fluxo:</strong> Coleta → Arquitetura → Setup → Testes → Validação → Hand-off
              </div>
              <div className="text-sm bg-gray-50 p-3 rounded">
                <strong>Templates:</strong> AppsFlyer Setup, GA4 App/Web, GTM Server, Eventos essenciais
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">📈 Playbook de Growth</h3>
              <p className="text-gray-600 mb-3">Aquisição e performance para apps</p>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Framework:</strong> Planejamento → Creatives → Testes → Controle → Otimização → Relatório
              </div>
              <div className="text-sm bg-gray-50 p-3 rounded">
                <strong>Foco:</strong> ASA, UA, Incrementalidade, Performance diária
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">💻 Playbook de Tech</h3>
              <p className="text-gray-600 mb-3">Desenvolvimento, APIs, Supabase e documentação</p>
              <div className="text-sm text-gray-500 mb-3">
                <strong>Inclui:</strong> Padrões de desenvolvimento, Versionamento, Bridge, Audit, APIs
              </div>
              <div className="text-sm bg-gray-50 p-3 rounded">
                <strong>Conexões:</strong> Bridge SDK, Audit integração, Supabase config, Logs essenciais
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'produtos' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveModule('home')}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-bold">🚀 Produtos da Caaqui</h2>
          <p className="text-gray-600 mb-6">Portfólio completo de produtos e serviços</p>
          
          <div className="grid gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2 text-blue-900">📧 CRM (Core)</h3>
              <p className="text-blue-800 mb-3">Produto principal da empresa - modelo de assinatura</p>
              <div className="text-sm text-blue-700">
                <strong>Inclui:</strong> Diagnóstico, Jornadas, Segmentação, Campanhas, Automação, Relatórios
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">🔗 Martech</h3>
              <p className="text-gray-600 mb-3">Implementações técnicas especializadas</p>
              <div className="text-sm text-gray-500">
                <strong>Serviços:</strong> AppsFlyer, Adjust, Branch, GA4, GTM, SDK, Eventos
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">📈 Growth</h3>
              <p className="text-gray-600 mb-3">Aquisição e performance para apps</p>
              <div className="text-sm text-gray-500">
                <strong>Canais:</strong> ASA, Google Ads, Facebook, TikTok, UA, Incrementalidade
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">💻 Tech</h3>
              <p className="text-gray-600 mb-3">Squads dedicadas e integrações</p>
              <div className="text-sm text-gray-500">
                <strong>Serviços:</strong> Desenvolvimento, APIs, Integrações, Suporte técnico
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2 text-green-900">🔍 EcomAudit (SaaS)</h3>
              <p className="text-green-800 mb-3">Produto SaaS para auditoria de e-commerce</p>
              <div className="text-sm text-green-700">
                <strong>Funcionalidades:</strong> Análise automática, Relatórios, Recomendações
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2 text-purple-900">🌉 Bridge (SDK)</h3>
              <p className="text-purple-800 mb-3">SDK de atribuição proprietário</p>
              <div className="text-sm text-purple-700">
                <strong>Recursos:</strong> Tracking, Atribuição, Analytics, Integração nativa
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">⚙️ ProjectOps</h3>
              <p className="text-gray-600 mb-3">Sistema interno (futuro produto)</p>
              <div className="text-sm text-gray-500">
                <strong>Status:</strong> Uso interno → Produto comercial
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'clientes' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveModule('home')}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-bold">👥 Clientes</h2>
          <p className="text-gray-600 mb-6">Onboarding e operação de clientes</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Processo de Onboarding</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div>1. <strong>Kickoff</strong> - Reunião de 1h para alinhamento</div>
              <div>2. <strong>Levantamento técnico</strong> - Acessos e ferramentas</div>
              <div>3. <strong>Mapeamento de dados</strong> - Base atual e histórico</div>
              <div>4. <strong>Cronograma</strong> - Definição de prazos e entregas</div>
              <div>5. <strong>Rotina semanal</strong> - Cadência de reuniões</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Cliente A - E-commerce</h3>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Ativo</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Produto:</strong> CRM + Martech</div>
                <div><strong>Squad:</strong> CRM Lead + Analista</div>
                <div><strong>Próxima Weekly:</strong> Sexta 14h</div>
                <div><strong>Sprint Atual:</strong> Jornadas de abandono</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button 
                  onClick={() => {
                    console.log('Navegando para projeto do Cliente A');
                    setActiveModule('projetos');
                  }}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 cursor-pointer"
                >
                  Ver Projeto
                </button>
                <button 
                  onClick={() => {
                    console.log('Abrindo histórico do Cliente A');
                    alert('📋 Histórico Cliente A\n\n• Nov 2024: Jornadas de abandono\n• Out 2024: Setup GA4\n• Set 2024: Diagnóstico inicial');
                  }}
                  className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer"
                >
                  Histórico
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Cliente B - Fintech</h3>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Onboarding</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Produto:</strong> Growth + Tech</div>
                <div><strong>Squad:</strong> Growth Lead + Dev</div>
                <div><strong>Kickoff:</strong> Agendado para segunda</div>
                <div><strong>Status:</strong> Aguardando acessos</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button 
                  onClick={() => {
                    console.log('Iniciando kickoff Cliente B');
                    alert('🚀 Kickoff Cliente B\n\nData: Segunda-feira 14h\nParticipantes: Growth Lead + Dev + Cliente\nObjetivo: Alinhamento inicial e definição de acessos');
                  }}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 cursor-pointer"
                >
                  Iniciar Kickoff
                </button>
                <button 
                  onClick={() => {
                    console.log('Abrindo checklist Cliente B');
                    alert('✅ Checklist Onboarding\n\n□ Acessos GA4\n□ Acessos AppsFlyer\n□ Documentação técnica\n□ Cronograma definido\n□ Rotina semanal acordada');
                  }}
                  className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer"
                >
                  Checklist
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Cliente C - Marketplace</h3>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Diagnóstico</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Produto:</strong> CRM Completo</div>
                <div><strong>Squad:</strong> CRM Lead + 2 Analistas</div>
                <div><strong>Entrega:</strong> Diagnóstico até quinta</div>
                <div><strong>Progresso:</strong> 70% concluído</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button 
                  onClick={() => {
                    console.log('Abrindo diagnóstico Cliente C');
                    alert('🔍 Diagnóstico CRM - Cliente C\n\nProgresso: 70%\n\n✅ Análise da base atual\n✅ Mapeamento de jornadas\n🔄 Identificação de oportunidades\n⏳ Roadmap 12 semanas');
                  }}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 cursor-pointer"
                >
                  Ver Diagnóstico
                </button>
                <button 
                  onClick={() => {
                    console.log('Agendando apresentação Cliente C');
                    alert('📅 Agendar Apresentação\n\nData sugerida: Quinta-feira 15h\nDuração: 1h\nParticipantes: CRM Lead + Cliente\nObjetivo: Apresentar diagnóstico e roadmap');
                  }}
                  className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer"
                >
                  Agendar Apresentação
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Cliente D - SaaS</h3>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">Bloqueado</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Produto:</strong> Martech + Bridge</div>
                <div><strong>Bloqueio:</strong> Acessos GA4 pendentes</div>
                <div><strong>Responsável:</strong> Cliente (TI)</div>
                <div><strong>Follow-up:</strong> Diário até resolver</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button 
                  onClick={() => {
                    console.log('Escalando bloqueio Cliente D');
                    alert('⚠️ Escalar Bloqueio\n\nCliente: Cliente D - SaaS\nBloqueio: Acessos GA4 pendentes há 3 dias\nAção: Contatar founders para intervenção\nPróximo passo: Call com TI do cliente');
                  }}
                  className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 cursor-pointer"
                >
                  Escalar Bloqueio
                </button>
                <button 
                  onClick={() => {
                    console.log('Abrindo histórico Cliente D');
                    alert('📋 Histórico Cliente D\n\n• 28/11: Bloqueio iniciado\n• 25/11: Solicitação de acessos\n• 22/11: Kickoff realizado\n• 20/11: Contrato assinado');
                  }}
                  className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer"
                >
                  Histórico
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'projetos' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveModule('home')}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-bold">📋 Projetos</h2>
          <p className="text-gray-600 mb-6">Sprints, demandas e entregas</p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">🔄 Fluxo Padrão de Projeto</h3>
            <div className="text-sm text-green-800 flex flex-wrap gap-2">
              <span className="bg-white px-2 py-1 rounded">1. Kickoff</span>
              <span>→</span>
              <span className="bg-white px-2 py-1 rounded">2. Diagnóstico</span>
              <span>→</span>
              <span className="bg-white px-2 py-1 rounded">3. Sprint 1</span>
              <span>→</span>
              <span className="bg-white px-2 py-1 rounded">4. Execução</span>
              <span>→</span>
              <span className="bg-white px-2 py-1 rounded">5. QA</span>
              <span>→</span>
              <span className="bg-white px-2 py-1 rounded">6. Entrega</span>
              <span>→</span>
              <span className="bg-white px-2 py-1 rounded">7. Handoff</span>
            </div>
          </div>

          {/* Seleção de projeto real + ações */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Projeto:</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setSelectedSprintId('');
                    setIsCreatingSprint(false);
                  }}
                  className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
                >
                  <option value="">Selecione um projeto</option>
                  {projectsByClient.map(group => (
                    <optgroup key={group.client} label={group.client}>
                      {group.projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                {selectedProjectId && (
                  <button
                    onClick={() => {
                      setIsCreatingSprint((prev) => !prev);
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                  >
                    {isCreatingSprint ? 'Cancelar Nova Sprint' : '➕ Nova Sprint'}
                  </button>
                )}
                <button
                  onClick={() => console.log('Visualizando sprints ativas')}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                >
                  📋 Sprints Ativas
                </button>
                <button
                  onClick={() => console.log('Abrindo histórico completo')}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
                >
                  📚 Histórico Completo
                </button>
              </div>
            </div>
          </div>

          {/* Formulário simples de criação de sprint */}
          {selectedProjectId && isCreatingSprint && (
            <div className="mb-6 bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3">Nova Sprint</h3>
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-700">Nome da sprint</label>
                  <input
                    type="text"
                    value={newSprintName}
                    onChange={(e) => setNewSprintName(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1"
                    placeholder="Ex: Sprint 1 - Jornadas CRM"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-700">Objetivo</label>
                  <input
                    type="text"
                    value={newSprintObjective}
                    onChange={(e) => setNewSprintObjective(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1"
                    placeholder="Resumo do objetivo da sprint"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-700">Início</label>
                  <input
                    type="date"
                    value={newSprintStart}
                    onChange={(e) => setNewSprintStart(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-700">Fim</label>
                  <input
                    type="date"
                    value={newSprintEnd}
                    onChange={(e) => setNewSprintEnd(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2 justify-end text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingSprint(false);
                    setNewSprintName('');
                    setNewSprintObjective('');
                    setNewSprintStart('');
                    setNewSprintEnd('');
                  }}
                  className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedProjectId) return;
                    try {
                      const baseDate = newSprintStart || newSprintEnd;
                      const todayIso = new Date().toISOString().slice(0, 10);
                      const start = newSprintStart || baseDate || todayIso;
                      const end = newSprintEnd || baseDate || todayIso;

                      await addSprint({
                        projectId: selectedProjectId,
                        number: (filteredSprints[filteredSprints.length - 1]?.number || 0) + 1,
                        name: newSprintName || undefined,
                        startDate: new Date(start),
                        endDate: new Date(end),
                        objective: newSprintObjective || undefined,
                        status: 'planned',
                        plannedHoursBillable: undefined,
                        plannedHoursNonBillable: undefined,
                        plannedHoursProduct: undefined,
                        retrospective: undefined,
                      });

                      setIsCreatingSprint(false);
                      setNewSprintName('');
                      setNewSprintObjective('');
                      setNewSprintStart('');
                      setNewSprintEnd('');
                    } catch (err) {
                      console.error('Erro ao criar sprint:', err);
                      alert('Erro ao criar sprint. Tente novamente.');
                    }
                  }}
                  className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                  disabled={!newSprintStart && !newSprintEnd}
                >
                  Salvar Sprint
                </button>
              </div>
            </div>
          )}

          {/* Lista de sprints reais do projeto selecionado */}
          <div className="grid gap-4 md:grid-cols-2">
            {selectedProjectId && filteredSprints.length === 0 && (
              <div className="text-sm text-gray-500 col-span-full">
                Nenhuma sprint cadastrada para este projeto.
              </div>
            )}

            {!selectedProjectId && (
              <div className="text-sm text-gray-500 col-span-full">
                Selecione um projeto para ver as sprints.
              </div>
            )}

            {filteredSprints.map(sprint => {
              const sprintTasks = sprintEntries.filter(e => e.sprintId === sprint.id);
              const doneCount = sprintTasks.filter(e => e.status === 'done').length;
              return (
                <div
                  key={sprint.id}
                  className={`bg-white border rounded-lg p-4 cursor-pointer transition-shadow hover:shadow-md ${
                    selectedSprintId === sprint.id ? 'ring-2 ring-blue-400' : ''
                  }`}
                  onClick={() => setSelectedSprintId(sprint.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">
                      {sprint.name || `Sprint ${sprint.number ?? ''}`}
                    </h3>
                    {sprint.status && (
                      <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs capitalize">
                        {sprint.status}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    {sprint.objective && (
                      <div>
                        <strong>Objetivo:</strong> {sprint.objective}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {sprint.startDate && (
                        <span>
                          <strong>Início:</strong> {new Date(sprint.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {sprint.endDate && (
                        <span>
                          <strong>Fim:</strong> {new Date(sprint.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span>
                        {sprintTasks.length} tarefa(s)
                      </span>
                      {sprintTasks.length > 0 && (
                        <span>
                          • {doneCount}/{sprintTasks.length} concluídas
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabela simples de tarefas da sprint selecionada */}
          {selectedSprintId && (
            <div className="mt-6 bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-sm">Tarefas da Sprint</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-2 text-left font-medium text-gray-700">Tarefa</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700">Responsável</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700">Status</th>
                      <th className="px-2 py-2 text-right font-medium text-gray-700">Horas Planejadas</th>
                      <th className="px-2 py-2 text-right font-medium text-gray-700">Horas Gastas</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSprintEntries.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-2 py-3 text-center text-gray-500"
                        >
                          Nenhuma tarefa cadastrada para esta sprint.
                        </td>
                      </tr>
                    )}

                    {visibleSprintEntries.map(entry => {
                      const collaborator = collaborators.find(c => c.id === entry.collaboratorId);
                      return (
                        <tr key={entry.id} className="border-t">
                          <td className="px-2 py-2 align-top">
                            <div className="font-medium text-gray-900">
                              {entry.title || 'Sem título'}
                            </div>
                          </td>
                          <td className="px-2 py-2 align-top">
                            {collaborator ? collaborator.name : '-'}
                          </td>
                          <td className="px-2 py-2 align-top capitalize">
                            {entry.status || '-'}
                          </td>
                          <td className="px-2 py-2 text-right align-top">
                            {entry.plannedHours != null ? entry.plannedHours.toFixed(1) : '-'}
                          </td>
                          <td className="px-2 py-2 text-right align-top">
                            {entry.spentHours != null ? entry.spentHours.toFixed(1) : '-'}
                          </td>
                          <td className="px-2 py-2 align-top">
                            {entry.reason || '-'}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Linha de criação rápida de tarefa */}
                    {selectedSprintId && (
                      <tr className="border-t bg-gray-50">
                        <td className="px-2 py-2 align-top">
                          <input
                            type="text"
                            value={newEntryTitle}
                            onChange={(e) => setNewEntryTitle(e.target.value)}
                            placeholder="Nova tarefa (Ex: Acessos, Warmup, Novo IP)"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <select
                            value={newEntryCollaboratorId}
                            onChange={(e) => setNewEntryCollaboratorId(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                          >
                            <option value="">-</option>
                            {collaborators.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 align-top">
                          <select
                            value={newEntryStatus}
                            onChange={(e) => setNewEntryStatus(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                          >
                            <option value="todo">A Fazer</option>
                            <option value="doing">Em Progresso</option>
                            <option value="done">Concluída</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 text-right align-top">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={newEntryPlannedHours}
                            onChange={(e) => setNewEntryPlannedHours(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-right"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-2 py-2 text-right align-top">
                          {/* Horas gastas serão atualizadas depois, por enquanto deixamos em branco */}
                          -
                        </td>
                        <td className="px-2 py-2 align-top">
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={newEntryReason}
                              onChange={(e) => setNewEntryReason(e.target.value)}
                              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                              placeholder="Observações (opcional)"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                if (!selectedSprintId || !selectedProjectId || !newEntryTitle.trim()) return;
                                try {
                                  const planned = newEntryPlannedHours ? parseFloat(newEntryPlannedHours) : undefined;
                                  await addSprintEntry({
                                    sprintId: selectedSprintId,
                                    projectId: selectedProjectId,
                                    collaboratorId: newEntryCollaboratorId || undefined,
                                    title: newEntryTitle.trim(),
                                    status: newEntryStatus as any,
                                    plannedHours: planned,
                                    spentHours: undefined,
                                    reason: newEntryReason || undefined,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                  });

                                  setNewEntryTitle('');
                                  setNewEntryCollaboratorId('');
                                  setNewEntryStatus('todo');
                                  setNewEntryPlannedHours('');
                                  setNewEntryReason('');
                                } catch (err) {
                                  console.error('Erro ao criar tarefa da sprint:', err);
                                  alert('Erro ao criar tarefa. Tente novamente.');
                                }
                              }}
                              className="px-2 py-1 rounded bg-blue-600 text-white text-[11px] hover:bg-blue-700 disabled:opacity-60"
                              disabled={!newEntryTitle.trim()}
                            >
                              Adicionar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Painel simples de horas planejadas por tipo para o projeto selecionado */}
          {selectedProjectId && selectedProjectHoursSummary && (
            <div className="mt-6 bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-sm">Horas planejadas por tipo (mês)</h3>
              <div className="grid gap-4 md:grid-cols-4 text-xs mb-4">
                {['billable', 'non_billable', 'product'].map(type => (
                  <div key={type} className="bg-white border rounded p-3 text-center">
                    <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wide">
                      {type === 'billable' && 'Billable'}
                      {type === 'non_billable' && 'Não Billable'}
                      {type === 'product' && 'Produto Interno'}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(selectedProjectHoursSummary.totalByType[type] || 0).toFixed(1)}h
                    </div>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-[11px]">
                  <thead>
                    <tr className="bg-white">
                      <th className="px-2 py-2 text-left font-medium text-gray-700">Pessoa</th>
                      <th className="px-2 py-2 text-right font-medium text-gray-700">Billable</th>
                      <th className="px-2 py-2 text-right font-medium text-gray-700">Não Billable</th>
                      <th className="px-2 py-2 text-right font-medium text-gray-700">Produto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProjectHoursSummary.byCollaborator.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-3 text-center text-gray-500">
                          Nenhuma alocação cadastrada para este projeto.
                        </td>
                      </tr>
                    )}
                    {selectedProjectHoursSummary.byCollaborator.map(row => (
                      <tr key={row.collaboratorId} className="border-t bg-white">
                        <td className="px-2 py-2">
                          {row.collaboratorName}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {(row.byType['billable'] || 0).toFixed(1)}h
                        </td>
                        <td className="px-2 py-2 text-right">
                          {(row.byType['non_billable'] || 0).toFixed(1)}h
                        </td>
                        <td className="px-2 py-2 text-right">
                          {(row.byType['product'] || 0).toFixed(1)}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeModule === 'governanca' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveModule('home')}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-bold">🏛️ Governança</h2>
          <p className="text-gray-600 mb-6">Reuniões, comunicação e SLAs</p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">📊 SLAs Internos</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Brief</span>
                  <span className="font-semibold">24h</span>
                </div>
                <div className="flex justify-between">
                  <span>Demanda pequena</span>
                  <span className="font-semibold">48-72h</span>
                </div>
                <div className="flex justify-between">
                  <span>Demanda média</span>
                  <span className="font-semibold">5 dias</span>
                </div>
                <div className="flex justify-between">
                  <span>Demanda grande</span>
                  <span className="font-semibold">Sprint dedicada</span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">🤝 SLAs Externos</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Resposta a dúvidas</span>
                  <span className="font-semibold">24h</span>
                </div>
                <div className="flex justify-between">
                  <span>Entrega semanal</span>
                  <span className="font-semibold">Garantida</span>
                </div>
                <div className="flex justify-between">
                  <span>Relatório mensal</span>
                  <span className="font-semibold">Último dia útil</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">📅 Cadência Semanal</h3>
            <div className="grid gap-3 md:grid-cols-3 text-sm">
              <div className="bg-white p-3 rounded">
                <div className="font-semibold text-blue-900">Segunda-feira</div>
                <div className="text-blue-800">Sprint Planning</div>
                <div className="text-blue-800">Atualização DeOps</div>
                <div className="text-blue-800">Priorização interna</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="font-semibold text-blue-900">Terça-Quinta</div>
                <div className="text-blue-800">Execução</div>
                <div className="text-blue-800">QA interno</div>
                <div className="text-blue-800">Check-in Slack</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="font-semibold text-blue-900">Sexta-feira</div>
                <div className="text-blue-800">Weekly interna</div>
                <div className="text-blue-800">Pauta do cliente</div>
                <div className="text-blue-800">Relatório semanal</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-3">💬 Regras de Comunicação</h3>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span><strong>Slack</strong> → Comunicação interna</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span><strong>Email</strong> → Assuntos formais</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span><strong>WhatsApp</strong> → Emergência</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span><strong>DeOps</strong> → Documentação oficial</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">✅ Regras de Ouro</h3>
            <div className="text-sm text-green-800 space-y-1">
              <div>• Tudo documentado no DeOps</div>
              <div>• Nada entregue sem QA</div>
              <div>• Nenhuma reunião sem pauta</div>
              <div>• Nenhuma demanda sem responsável</div>
              <div>• Brief sempre antes da execução</div>
              <div>• Status atualizado diariamente</div>
              <div>• Cliente nunca pergunta "e aí?"</div>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'dados' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveModule('home')}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-bold">📊 Dados</h2>
          <p className="text-gray-600 mb-6">Eventos, auditorias e dicionários</p>
          
          <div className="grid gap-4">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">📈 Dicionário GA4</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Evento</th>
                      <th className="text-left p-2">Descrição</th>
                      <th className="text-left p-2">Parâmetros</th>
                      <th className="text-left p-2">Prioridade</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-mono">purchase</td>
                      <td className="p-2">Compra realizada</td>
                      <td className="p-2">value, currency, items</td>
                      <td className="p-2"><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Alta</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">add_to_cart</td>
                      <td className="p-2">Produto adicionado ao carrinho</td>
                      <td className="p-2">value, currency, items</td>
                      <td className="p-2"><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Alta</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">begin_checkout</td>
                      <td className="p-2">Início do checkout</td>
                      <td className="p-2">value, currency, items</td>
                      <td className="p-2"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Média</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">view_item</td>
                      <td className="p-2">Visualização de produto</td>
                      <td className="p-2">value, currency, items</td>
                      <td className="p-2"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Média</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">🚀 Dicionário AppsFlyer</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Evento</th>
                      <th className="text-left p-2">Valor</th>
                      <th className="text-left p-2">Atribuição</th>
                      <th className="text-left p-2">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-mono">af_purchase</td>
                      <td className="p-2">Revenue</td>
                      <td className="p-2">Last Click</td>
                      <td className="p-2">Evento principal de conversão</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">af_add_to_cart</td>
                      <td className="p-2">Product Value</td>
                      <td className="p-2">Last Click</td>
                      <td className="p-2">Micro-conversão importante</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">af_initiated_checkout</td>
                      <td className="p-2">Cart Value</td>
                      <td className="p-2">Last Click</td>
                      <td className="p-2">Funil de conversão</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">🌉 Dicionário Bridge</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Parâmetro</th>
                      <th className="text-left p-2">Descrição</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Obrigatório</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-mono">loc_source</td>
                      <td className="p-2">Fonte do tráfego</td>
                      <td className="p-2">String</td>
                      <td className="p-2"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Sim</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">loc_medium</td>
                      <td className="p-2">Meio do tráfego</td>
                      <td className="p-2">String</td>
                      <td className="p-2"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Sim</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">id_install</td>
                      <td className="p-2">ID único da instalação</td>
                      <td className="p-2">UUID</td>
                      <td className="p-2"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Sim</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-mono">sdk_version</td>
                      <td className="p-2">Versão do SDK Bridge</td>
                      <td className="p-2">String</td>
                      <td className="p-2"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Não</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-3">🔍 Auditoria Semanal</h3>
              <div className="text-sm text-red-800 space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Eventos ativos funcionando</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Eventos quebrados identificados</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Eventos sem parâmetros obrigatórios</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Links não funcionando</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>UTMs inválidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Problemas de sessão</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModule === 'time' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveModule('home')}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h2 className="text-2xl font-bold">👨‍💼 Time</h2>
          <p className="text-gray-600 mb-6">Responsabilidades e RACI</p>
          
          <div className="bg-white border rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-lg mb-3">📋 RACI Global</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Área</th>
                    <th className="text-left p-2">Responsável (R)</th>
                    <th className="text-left p-2">Aprovador (A)</th>
                    <th className="text-left p-2">Consultado (C)</th>
                    <th className="text-left p-2">Informado (I)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-semibold">CRM</td>
                    <td className="p-2">Analistas CRM</td>
                    <td className="p-2">Líder CRM</td>
                    <td className="p-2">Growth</td>
                    <td className="p-2">Sócios</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-semibold">Martech</td>
                    <td className="p-2">Tech/Martech</td>
                    <td className="p-2">Head Tech</td>
                    <td className="p-2">CRM</td>
                    <td className="p-2">Sócios</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-semibold">Growth</td>
                    <td className="p-2">Growth</td>
                    <td className="p-2">Head Growth</td>
                    <td className="p-2">CRM/Tech</td>
                    <td className="p-2">Sócios</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-semibold">Comercial</td>
                    <td className="p-2">Founders</td>
                    <td className="p-2">Founders</td>
                    <td className="p-2">Líderes</td>
                    <td className="p-2">Time</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">🎯 Competências CRM</h3>
              <div className="text-sm space-y-1">
                <div>• Diagnóstico de base</div>
                <div>• Criação de jornadas</div>
                <div>• Segmentação avançada</div>
                <div>• Automação de campanhas</div>
                <div>• Análise de performance</div>
                <div>• Copywriting</div>
                <div>• Relatórios executivos</div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">⚙️ Competências Martech</h3>
              <div className="text-sm space-y-1">
                <div>• Setup GA4/GTM</div>
                <div>• Implementação AppsFlyer</div>
                <div>• Configuração Adjust/Branch</div>
                <div>• Mapeamento de eventos</div>
                <div>• Laudos técnicos</div>
                <div>• Integração de SDKs</div>
                <div>• Troubleshooting</div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">📈 Competências Growth</h3>
              <div className="text-sm space-y-1">
                <div>• Gestão de campanhas</div>
                <div>• Criação de criativos</div>
                <div>• Otimização de performance</div>
                <div>• ASA/Google Ads</div>
                <div>• Análise de incrementalidade</div>
                <div>• Testes A/B</div>
                <div>• Relatórios de mídia</div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">💻 Competências Tech</h3>
              <div className="text-sm space-y-1">
                <div>• Desenvolvimento full-stack</div>
                <div>• APIs e integrações</div>
                <div>• Banco de dados</div>
                <div>• DevOps e deploy</div>
                <div>• Code review</div>
                <div>• Documentação técnica</div>
                <div>• Suporte técnico</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModule !== 'home' && activeModule !== 'playbooks' && activeModule !== 'produtos' && activeModule !== 'clientes' && activeModule !== 'projetos' && activeModule !== 'governanca' && activeModule !== 'dados' && activeModule !== 'time' && (
        <div className="space-y-4">
          <button
            onClick={() => setActiveModule('home')}
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">🚧</div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Módulo em Desenvolvimento</h3>
            <p className="text-yellow-700">
              Este módulo será implementado nas próximas etapas do DeOps.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
