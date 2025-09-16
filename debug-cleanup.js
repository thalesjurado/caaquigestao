// Script para limpar dados corrompidos do localStorage
console.log('🧹 Limpando dados corrompidos do localStorage...');

// Função para executar no console do navegador
function debugLocalStorage() {
  // Lista todas as chaves do localStorage relacionadas ao projeto
  const keys = Object.keys(localStorage).filter(key => key.startsWith('caaqui_'));
  console.log('Chaves encontradas:', keys);

  keys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      console.log(`${key}:`, data.length, 'itens');
      
      if (key === 'caaqui_project_allocations') {
        console.log('Detalhes das alocações:');
        data.forEach((alloc, index) => {
          console.log(`  ${index + 1}. Projeto: ${alloc.project_id}, Colaborador: ${alloc.collaborator_id}, %: ${alloc.percentage}`);
        });
      }
      
      if (key === 'caaqui_projects') {
        console.log('Detalhes dos projetos:');
        data.forEach((proj, index) => {
          console.log(`  ${index + 1}. ${proj.name} (${proj.id}) - Cliente: ${proj.client}`);
        });
      }
    } catch (err) {
      console.error(`Erro ao ler ${key}:`, err);
    }
  });
}

// Função para limpar tudo
function clearAll() {
  const keys = Object.keys(localStorage).filter(key => key.startsWith('caaqui_'));
  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Removido: ${key}`);
  });
  console.log('🎉 Todos os dados foram limpos! Recarregue a página.');
}

// Função para limpar apenas alocações duplicadas
function cleanDuplicateAllocations() {
  try {
    const allocations = JSON.parse(localStorage.getItem('caaqui_project_allocations') || '[]');
    const seen = new Set();
    const cleaned = allocations.filter(alloc => {
      const key = `${alloc.project_id}-${alloc.collaborator_id}`;
      if (seen.has(key)) {
        console.log(`🗑️ Removendo duplicata: ${key}`);
        return false;
      }
      seen.add(key);
      return true;
    });
    
    localStorage.setItem('caaqui_project_allocations', JSON.stringify(cleaned));
    console.log(`✅ Limpeza concluída: ${allocations.length} → ${cleaned.length} alocações`);
  } catch (err) {
    console.error('Erro na limpeza:', err);
  }
}

// Expor funções globalmente para uso no console
window.debugLocalStorage = debugLocalStorage;
window.clearAll = clearAll;
window.cleanDuplicateAllocations = cleanDuplicateAllocations;

console.log('💡 Comandos disponíveis:');
console.log('- debugLocalStorage() - Mostra todos os dados');
console.log('- clearAll() - Limpa tudo');
console.log('- cleanDuplicateAllocations() - Remove duplicatas');

// Função para forçar recriação dos dados
function forceRecreateData() {
  // Remove dados existentes
  const keys = Object.keys(localStorage).filter(key => key.startsWith('caaqui_'));
  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Removido: ${key}`);
  });
  
  // Força recriação
  console.log('🔄 Recarregando página para recriar dados...');
  location.reload();
}

// Função para verificar dados atuais
function checkCurrentData() {
  console.log('📊 Verificando dados atuais:');
  
  const projects = JSON.parse(localStorage.getItem('caaqui_projects') || '[]');
  const allocations = JSON.parse(localStorage.getItem('caaqui_project_allocations') || '[]');
  
  console.log('Projetos:');
  projects.forEach(p => {
    console.log(`- ${p.name}: ${p.start_date} → ${p.end_date}`);
  });
  
  console.log('Alocações:');
  allocations.forEach(a => {
    console.log(`- Projeto ${a.project_id}: ${a.start_date} → ${a.end_date} (${a.percentage}%)`);
  });
}

// Expor função adicional
window.forceRecreateData = forceRecreateData;
window.checkCurrentData = checkCurrentData;

console.log('💡 Comandos disponíveis:');
console.log('- debugLocalStorage() - Mostra todos os dados');
console.log('- clearAll() - Limpa tudo');
console.log('- cleanDuplicateAllocations() - Remove duplicatas');
console.log('- forceRecreateData() - Remove tudo e recria dados');
console.log('- checkCurrentData() - Verifica datas dos projetos atuais');

// Executa automaticamente o debug
debugLocalStorage();
