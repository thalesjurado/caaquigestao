'use client';

import { useMemo } from 'react';
import { useAppStore } from '../../lib/store-supabase';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'overdue' | 'due_soon' | 'milestone';
  title: string;
  message: string;
  projectId: string;
  projectName: string;
  priority: 'high' | 'medium' | 'low';
  daysUntilDue?: number;
}

export default function ProjectNotifications() {
  const { projects, boardActivities } = useAppStore();

  const notifications = useMemo(() => {
    const now = new Date();
    const notifications: Notification[] = [];

    projects.forEach(project => {
      const daysUntilEnd = Math.ceil((project.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Projetos atrasados
      if (daysUntilEnd < 0 && project.status === 'active') {
        notifications.push({
          id: `overdue-${project.id}`,
          type: 'overdue',
          title: 'Projeto Atrasado',
          message: `${project.name} está ${Math.abs(daysUntilEnd)} dias em atraso`,
          projectId: project.id,
          projectName: project.name,
          priority: 'high',
          daysUntilDue: daysUntilEnd
        });
      }
      
      // Projetos com prazo próximo (7 dias)
      else if (daysUntilEnd > 0 && daysUntilEnd <= 7 && project.status === 'active') {
        notifications.push({
          id: `due-soon-${project.id}`,
          type: 'due_soon',
          title: 'Prazo Próximo',
          message: `${project.name} termina em ${daysUntilEnd} dias`,
          projectId: project.id,
          projectName: project.name,
          priority: daysUntilEnd <= 3 ? 'high' : 'medium',
          daysUntilDue: daysUntilEnd
        });
      }

      // Projetos com baixo progresso próximo ao prazo
      const projectTasks = boardActivities.filter(a => a.projectId === project.id);
      const completedTasks = projectTasks.filter(a => a.status === 'done').length;
      const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
      
      if (daysUntilEnd > 0 && daysUntilEnd <= 14 && progress < 50 && project.status === 'active') {
        notifications.push({
          id: `low-progress-${project.id}`,
          type: 'milestone',
          title: 'Progresso Baixo',
          message: `${project.name} tem apenas ${Math.round(progress)}% de progresso com ${daysUntilEnd} dias restantes`,
          projectId: project.id,
          projectName: project.name,
          priority: 'medium'
        });
      }
    });

    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [projects, boardActivities]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'due_soon':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'milestone':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <h3 className="font-medium text-green-800">Tudo em dia!</h3>
            <p className="text-sm text-green-600">Não há notificações urgentes no momento.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Notificações de Projetos</h3>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`border rounded-xl p-4 ${getBackgroundColor(notification.priority)}`}
        >
          <div className="flex items-start gap-3">
            {getIcon(notification.type)}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{notification.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Projeto: {notification.projectName}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  notification.priority === 'high' 
                    ? 'bg-red-100 text-red-700'
                    : notification.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {notification.priority === 'high' ? 'Alta' : notification.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
