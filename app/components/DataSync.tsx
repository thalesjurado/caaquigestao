'use client';

import { useState } from 'react';
import { exportData, importData } from '../../lib/data-sync';
import { useAppStore } from '../../lib/store-supabase';
import { toast } from '../../lib/toast';

export default function DataSync() {
  const [importing, setImporting] = useState(false);
  const loadAllData = useAppStore(s => s.loadAllData);

  const handleExport = () => {
    try {
      exportData();
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const success = importData(data.data || data);
      if (success) {
        toast.success('Dados importados com sucesso!');
        // Recarrega os dados no store
        await loadAllData();
      } else {
        toast.error('Erro ao importar dados - formato inválido');
      }
    } catch (error) {
      toast.error('Erro ao importar dados');
    } finally {
      setImporting(false);
      // Limpa o input
      event.target.value = '';
    }
  };

  return (
    <div className="bg-blue-50 rounded-xl p-4">
      <h3 className="font-semibold text-blue-800 mb-2">
        🔄 Sincronização de Dados
      </h3>
      <p className="text-sm text-blue-600 mb-4">
        Para compartilhar dados entre usuários, use as funções de exportar/importar.
      </p>
      
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleExport}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
        >
          📤 Exportar Dados
        </button>
        
        <label className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm cursor-pointer">
          {importing ? '⏳ Importando...' : '📥 Importar Dados'}
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
          />
        </label>
      </div>
      
      <div className="mt-3 text-xs text-blue-600">
        <p>• Exporte seus dados para fazer backup ou compartilhar</p>
        <p>• Importe dados de outro usuário para sincronizar</p>
        <p>• Os dados são salvos localmente no navegador</p>
      </div>
    </div>
  );
}
