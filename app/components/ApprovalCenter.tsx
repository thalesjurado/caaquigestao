'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, User, Calendar, DollarSign } from 'lucide-react';
import { useApprovals, ApprovalRequest } from '../../lib/approvals';

export default function ApprovalCenter() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'rules'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [comment, setComment] = useState('');
  
  const {
    requests,
    pendingRequests,
    rules,
    processApproval,
    cancelRequest,
    getRequestsForApprover,
    updateRule
  } = useApprovals();

  // Simular usuário atual - em produção viria do contexto de autenticação
  const currentUserId = 'mgmt-1';
  const currentUserName = 'João Silva';
  
  const myPendingRequests = getRequestsForApprover(currentUserId);
  const myRequests = requests.filter(r => r.requestedBy === currentUserId);

  const getStatusIcon = (status: ApprovalRequest['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getUrgencyColor = (urgency: ApprovalRequest['urgency']) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: ApprovalRequest['type']) => {
    const labels = {
      budget_change: 'Mudança de Orçamento',
      scope_change: 'Mudança de Escopo',
      timeline_change: 'Mudança de Prazo',
      team_change: 'Mudança de Equipe',
      project_creation: 'Criação de Projeto',
      project_cancellation: 'Cancelamento de Projeto'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: ApprovalRequest['type']) => {
    switch (type) {
      case 'budget_change':
        return <DollarSign className="w-4 h-4" />;
      case 'timeline_change':
        return <Calendar className="w-4 h-4" />;
      case 'team_change':
        return <User className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await processApproval(requestId, currentUserId, status, comment);
      setSelectedRequest(null);
      setComment('');
    } catch (error) {
      console.error('Erro ao processar aprovação:', error);
    }
  };

  const formatValue = (value: any, type: ApprovalRequest['type']) => {
    if (type === 'budget_change' && typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    if (type === 'timeline_change' && value instanceof Date) {
      return value.toLocaleDateString('pt-BR');
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Central de Aprovações</h2>
        <div className="flex items-center gap-2">
          {myPendingRequests.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
              {myPendingRequests.length} pendente{myPendingRequests.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Para Aprovar ({myPendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Histórico ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'rules'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Regras ({rules.length})
        </button>
      </div>

      {/* Conteúdo */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {myPendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma aprovação pendente</p>
              <p className="text-sm">Você está em dia! 🎉</p>
            </div>
          ) : (
            myPendingRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(request.type)}
                      <h3 className="font-semibold">{request.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Projeto: <span className="font-medium">{request.projectName}</span></p>
                        <p className="text-sm text-gray-600">Solicitado por: <span className="font-medium">{request.requestedByName}</span></p>
                        <p className="text-sm text-gray-600">Tipo: <span className="font-medium">{getTypeLabel(request.type)}</span></p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Criado em: <span className="font-medium">{request.createdAt.toLocaleDateString('pt-BR')}</span></p>
                        {request.deadline && (
                          <p className="text-sm text-gray-600">Prazo: <span className="font-medium">{request.deadline.toLocaleDateString('pt-BR')}</span></p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{request.description}</p>
                    
                    {request.currentValue && request.proposedValue && (
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Valor Atual</p>
                            <p className="font-medium">{formatValue(request.currentValue, request.type)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Valor Proposto</p>
                            <p className="font-medium">{formatValue(request.proposedValue, request.type)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 rounded p-3 mb-4">
                      <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Justificativa</p>
                      <p className="text-sm text-blue-800">{request.justification}</p>
                    </div>

                    {/* Status das aprovações */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Status das Aprovações</p>
                      <div className="space-y-1">
                        {request.approvals.map((approval) => (
                          <div key={approval.approverId} className="flex items-center gap-2 text-sm">
                            {approval.status === 'approved' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : approval.status === 'rejected' ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className={approval.approverId === currentUserId ? 'font-medium' : ''}>
                              {approval.approverName}
                            </span>
                            {approval.status === 'approved' && (
                              <span className="text-green-600">✓ Aprovado</span>
                            )}
                            {approval.status === 'rejected' && (
                              <span className="text-red-600">✗ Rejeitado</span>
                            )}
                            {approval.status === 'pending' && approval.approverId === currentUserId && (
                              <span className="text-yellow-600">⏳ Aguardando sua aprovação</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações de aprovação */}
                {request.approvals.find(a => a.approverId === currentUserId)?.status === 'pending' && (
                  <div className="border-t pt-4">
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Comentário (opcional)</label>
                      <textarea
                        value={selectedRequest?.id === request.id ? comment : ''}
                        onChange={(e) => {
                          setComment(e.target.value);
                          setSelectedRequest(request);
                        }}
                        className="w-full border rounded-lg p-2 text-sm"
                        rows={2}
                        placeholder="Adicione um comentário sobre sua decisão..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproval(request.id, 'approved')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        ✓ Aprovar
                      </button>
                      <button
                        onClick={() => handleApproval(request.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                      >
                        ✗ Rejeitar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(request.status)}
                      <h3 className="font-semibold">{request.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <p>Projeto: <span className="font-medium">{request.projectName}</span></p>
                        <p>Tipo: <span className="font-medium">{getTypeLabel(request.type)}</span></p>
                      </div>
                      <div>
                        <p>Solicitado por: <span className="font-medium">{request.requestedByName}</span></p>
                        <p>Status: <span className={`font-medium ${
                          request.status === 'approved' ? 'text-green-600' :
                          request.status === 'rejected' ? 'text-red-600' :
                          request.status === 'cancelled' ? 'text-gray-600' :
                          'text-yellow-600'
                        }`}>
                          {request.status === 'approved' ? 'Aprovado' :
                           request.status === 'rejected' ? 'Rejeitado' :
                           request.status === 'cancelled' ? 'Cancelado' :
                           'Pendente'}
                        </span></p>
                      </div>
                      <div>
                        <p>Criado: <span className="font-medium">{request.createdAt.toLocaleDateString('pt-BR')}</span></p>
                        <p>Atualizado: <span className="font-medium">{request.updatedAt.toLocaleDateString('pt-BR')}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-4">Regras de Aprovação</h3>
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-gray-600">
                      Tipo: {getTypeLabel(rule.type)}
                      {rule.conditions.budgetThreshold && ` • Limite: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rule.conditions.budgetThreshold)}`}
                      {rule.conditions.timelineChangeThreshold && ` • Prazo: ${rule.conditions.timelineChangeThreshold} dias`}
                    </p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
