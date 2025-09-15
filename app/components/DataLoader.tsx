'use client';

import { useEffect } from 'react';
import { useAppStore } from '../../lib/store-supabase';

export default function DataLoader({ children }: { children: React.ReactNode }) {
  const loadAllData = useAppStore(s => s.loadAllData);
  const isLoading = useAppStore(s => s.isLoading);
  const error = useAppStore(s => s.error);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

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
