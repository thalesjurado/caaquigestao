'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store-supabase';
import { useReports, ReportTemplate, GeneratedReport } from '@/lib/reports';
import { showToast } from '@/lib/toast';

export default function ReportCenter() {
  const [activeTab, setActiveTab] = useState<'reports' | 'templates' | 'generate'>('reports');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [reportPeriod, setReportPeriod] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const { projects, collaborators, projectAllocations, boardActivities } = useAppStore();
  const { 
    templates, 
    reports, 
    generateReport, 
    exportToHTML, 
    updateTemplate,
    markReportAsSent 
  } = useReports();

  // Obter lista única de clientes
  const clients = Array.from(new Set(projects.map(p => p.client).filter(Boolean)));

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !selectedClient) {
      showToast('Selecione um template e cliente', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const period = {
        start: new Date(reportPeriod.start),
        end: new Date(reportPeriod.end)
      };

      const report = await generateReport(
        selectedTemplate,
        selectedClient,
        period,
        projects,
        collaborators,
        projectAllocations,
        boardActivities
      );

      showToast('Relatório gerado com sucesso!', 'success');
      setActiveTab('reports');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      showToast('Erro ao gerar relatório', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportReport = (report: GeneratedReport) => {
    try {
      const html = exportToHTML(report);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      markReportAsSent(report.id);
      showToast('Relatório exportado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      showToast('Erro ao exportar relatório', 'error');
    }
  };

  const handleToggleTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      updateTemplate(templateId, { enabled: !template.enabled });
      showToast(
        `Template ${template.enabled ? 'desabilitado' : 'habilitado'}`,
        'success'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Centro de Relatórios</h2>
        <div className="text-sm text-gray-500">
          {reports.length} relatório(s) gerado(s)
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Relatórios Gerados
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ➕ Gerar Relatório
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 Templates
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>Nenhum relatório gerado ainda</p>
              <p className="text-sm">Clique em "Gerar Relatório" para começar</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-white border rounded-lg p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{report.title}</h3>
                      <p className="text-gray-600 text-sm">
                        Cliente: {report.client} • Template: {report.templateName}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Período: {report.period.start.toLocaleDateString('pt-BR')} a {report.period.end.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === 'sent' 
                          ? 'bg-green-100 text-green-800'
                          : report.status === 'viewed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status === 'sent' ? 'Enviado' : 
                         report.status === 'viewed' ? 'Visualizado' : 'Rascunho'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {report.content.summary.totalProjects}
                      </div>
                      <div className="text-sm text-gray-500">Projetos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {report.content.summary.completedProjects}
                      </div>
                      <div className="text-sm text-gray-500">Concluídos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {report.content.summary.activeProjects}
                      </div>
                      <div className="text-sm text-gray-500">Ativos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(report.content.summary.totalBudget)}
                      </div>
                      <div className="text-sm text-gray-500">Orçamento</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Gerado em {report.generatedAt.toLocaleDateString('pt-BR')} às {report.generatedAt.toLocaleTimeString('pt-BR')}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleExportReport(report)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        📥 Exportar HTML
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Gerar Novo Relatório</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione um template</option>
                {templates.filter(t => t.enabled).map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={reportPeriod.start}
                onChange={(e) => setReportPeriod(prev => ({ ...prev, start: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={reportPeriod.end}
                onChange={(e) => setReportPeriod(prev => ({ ...prev, end: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || !selectedTemplate || !selectedClient}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? '⏳ Gerando...' : '📊 Gerar Relatório'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Templates de Relatório</h3>
            <div className="text-sm text-gray-500">
              {templates.filter(t => t.enabled).length} de {templates.length} habilitado(s)
            </div>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <div key={template.id} className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold">{template.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.type === 'weekly' ? 'bg-blue-100 text-blue-800' :
                        template.type === 'monthly' ? 'bg-green-100 text-green-800' :
                        template.type === 'milestone' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {template.type === 'weekly' ? 'Semanal' :
                         template.type === 'monthly' ? 'Mensal' :
                         template.type === 'milestone' ? 'Marco' : 'Personalizado'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {template.enabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Frequência:</span>
                        <div className="text-gray-600">
                          {template.frequency === 'weekly' ? 'Semanal' :
                           template.frequency === 'monthly' ? 'Mensal' :
                           template.frequency === 'quarterly' ? 'Trimestral' :
                           'Sob demanda'}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Formato:</span>
                        <div className="text-gray-600">{template.format.toUpperCase()}</div>
                      </div>
                      <div>
                        <span className="font-medium">Auto-envio:</span>
                        <div className="text-gray-600">{template.autoSend ? 'Sim' : 'Não'}</div>
                      </div>
                      <div>
                        <span className="font-medium">Seções:</span>
                        <div className="text-gray-600">{template.sections.length} seção(ões)</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleTemplate(template.id)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        template.enabled
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {template.enabled ? 'Desabilitar' : 'Habilitar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
