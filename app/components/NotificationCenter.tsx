'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, Settings, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useNotifications, Notification, NotificationRule } from '../../lib/notifications';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const {
    notifications,
    unreadNotifications,
    unreadCount,
    rules,
    markAsRead,
    markAllAsRead,
    removeNotification,
    updateRule
  } = useNotifications();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      window.location.hash = notification.actionUrl.replace('#', '');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Botão de notificação */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notificações"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">Notificações</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                  {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('settings')}
                className={`p-1 rounded ${activeTab === 'settings' ? 'bg-gray-100' : ''}`}
                title="Configurações"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Notificações ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Configurações
            </button>
          </div>

          {/* Conteúdo */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'notifications' ? (
              <div>
                {/* Ações */}
                {notifications.length > 0 && (
                  <div className="p-3 border-b bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''}
                      </span>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Marcar todas como lidas
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de notificações */}
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma notificação</p>
                    <p className="text-sm">Você está em dia! 🎉</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="p-1 rounded hover:bg-gray-200"
                                  title="Remover"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                              >
                                Marcar como lida
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Configurações */
              <div className="p-4">
                <h4 className="font-medium mb-4">Regras de Notificação</h4>
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{rule.name}</h5>
                        <p className="text-xs text-gray-600 mt-1">
                          {rule.type === 'deadline' && `${rule.conditions.daysBeforeDeadline} dias antes do prazo`}
                          {rule.type === 'overallocation' && `Alocação > ${rule.conditions.allocationThreshold}%`}
                          {rule.type === 'status_change' && 'Mudança de status'}
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

                <div className="mt-6 pt-4 border-t">
                  <h5 className="font-medium text-sm mb-2">Configurações Gerais</h5>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Notificações por email</span>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Sons de notificação</span>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Funcionalidades avançadas em desenvolvimento
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
