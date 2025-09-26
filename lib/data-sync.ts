// Sistema de sincronização de dados melhorado
'use client';

// Chaves para localStorage
const STORAGE_KEYS = {
  BOARD_ACTIVITIES: 'caaqui_board_activities',
  PROJECTS: 'caaqui_projects',
  PROJECT_ALLOCATIONS: 'caaqui_project_allocations',
  COLLABORATORS: 'caaqui_collaborators',
  OKRS: 'caaqui_okrs',
  RITUALS: 'caaqui_rituals',
  LAST_SYNC: 'caaqui_last_sync',
} as const;

// Interface para dados sincronizados
interface SyncData {
  timestamp: string;
  data: unknown;
  userId?: string;
}

// Função para salvar dados com timestamp
export function saveToStorage(key: string, data: unknown, userId?: string): void {
  try {
    const syncData: SyncData = {
      timestamp: new Date().toISOString(),
      data,
      userId,
    };
    localStorage.setItem(key, JSON.stringify(syncData));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    const count = Array.isArray(data) ? data.length : (typeof data === 'object' && data !== null ? Object.keys(data).length : 1);
    console.log(`💾 Dados salvos em ${key}:`, count, 'itens');
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
}

// Função para carregar dados do storage
export function loadFromStorage(key: string): unknown[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const syncData: SyncData = JSON.parse(stored);
    const dataArray = Array.isArray(syncData.data) ? syncData.data : [];
    console.log(`📦 Dados carregados de ${key}:`, dataArray.length, 'itens');
    return dataArray;
  } catch (error) {
    console.error('Erro ao carregar do localStorage:', error);
    return [];
  }
}

// Função para verificar se os dados são recentes
export function isDataFresh(key: string, maxAgeMinutes: number = 60): boolean {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return false;
    
    const syncData: SyncData = JSON.parse(stored);
    const dataAge = Date.now() - new Date(syncData.timestamp).getTime();
    const maxAge = maxAgeMinutes * 60 * 1000; // converter para ms
    
    return dataAge < maxAge;
  } catch {
    return false;
  }
}

// Função para limpar dados antigos
export function clearOldData() {
  try {
    const keys = Object.values(STORAGE_KEYS);
    keys.forEach(key => {
      if (!isDataFresh(key, 24 * 60)) { // 24 horas
        localStorage.removeItem(key);
        console.log(`🧹 Dados antigos removidos: ${key}`);
      }
    });
  } catch (error) {
    console.error('Erro ao limpar dados antigos:', error);
  }
}

// Função para exportar todos os dados
export function exportData(): Record<string, unknown> {
  try {
    const allData: Record<string, unknown> = {};
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = loadFromStorage(key);
      if (data.length > 0) {
        allData[key] = data;
      }
    });
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: allData,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caaqui-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📤 Dados exportados com sucesso');
    return allData;
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return {};
  }
}

// Função para importar dados
export function importData(data: Record<string, unknown>): boolean {
  try {
    Object.entries(data).forEach(([key, value]) => {
      saveToStorage(key, value);
    });
    console.log('📥 Dados importados com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    return false;
  }
}

// Função para sincronizar dados entre abas/janelas
export function setupStorageSync(callback: () => void) {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key as any)) {
      console.log('🔄 Dados atualizados em outra aba, recarregando...');
      callback();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

export { STORAGE_KEYS };
