'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '../../lib/store-supabase';
import { saveToStorage, STORAGE_KEYS } from '../../lib/data-sync';

export default function DataLoader({ children }: { children: React.ReactNode }) {
  const loadAllData = useAppStore(s => s.loadAllData);
  const isLoading = useAppStore(s => s.isLoading);
  const error = useAppStore(s => s.error);
  const setLoading = useAppStore(s => s.setLoading);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Migração de storage legado -> novo formato por entidade
      try {
        const legacy = localStorage.getItem('caaqui-projectops-data');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          const boardActivities = parsed?.boardActivities ?? [];
          const collaborators = parsed?.collaborators ?? [];
          const okrs = parsed?.okrs ?? [];
          const rituals = parsed?.rituals ?? [];
          if (boardActivities.length > 0) saveToStorage(STORAGE_KEYS.BOARD_ACTIVITIES, boardActivities);
          if (collaborators.length > 0) saveToStorage(STORAGE_KEYS.COLLABORATORS, collaborators);
          if (okrs.length > 0) saveToStorage(STORAGE_KEYS.OKRS, okrs);
          if (rituals.length > 0) saveToStorage(STORAGE_KEYS.RITUALS, rituals);
          localStorage.removeItem('caaqui-projectops-data');
          // Nota: projects e allocations já usam chaves próprias em outras rotas
          console.log('✅ Migração de storage legado concluída');
        }
      } catch (e) {
        console.warn('Falha na migração do storage legado:', e);
      }
      
      // Timeout de segurança: se demorar demais, usa fallback local
      const TIMEOUT_MS = 8000;
      const timeoutId = setTimeout(() => {
        console.warn('⏳ Timeout ao carregar dados remotos. Ativando fallback local.');
        setShowFallback(true);
        setLoading(false);
      }, TIMEOUT_MS);

      try {
        await loadAllData();
        
        // Se houver erro relacionado a projects/project_allocations, usa fallback
        if (error && (error.includes('projects') || error.includes('project_allocations'))) {
          console.log('Usando sistema de fallback para projects e project_allocations');
          setShowFallback(true);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setShowFallback(true);
        setLoading(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    loadData();
  }, [loadAllData, error, setLoading]);

  // Se o fallback foi ativado, rendeiriza a aplicação mesmo que o estado global ainda marque loading
  if (showFallback) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do Supabase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600 max-w-md mx-auto p-6">
          <p className="mb-4">❌ {error}</p>
          <div className="text-sm text-gray-600 mb-4">
            <p>Possíveis causas:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>• Credenciais do Supabase incorretas</li>
              <li>• Tabelas não criadas no banco</li>
              <li>• Problema de conexão</li>
            </ul>
          </div>
          <div className="space-y-2">
            <button 
              onClick={loadAllData}
              className="block w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Tentar novamente
            </button>
            <button 
              onClick={() => {
                // Fallback para localStorage temporário
                window.location.reload();
              }}
              className="block w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Recarregar página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
