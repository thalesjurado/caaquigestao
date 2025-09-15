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
        <div className="text-center text-red-600">
          <p className="mb-4">❌ {error}</p>
          <button 
            onClick={loadAllData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
