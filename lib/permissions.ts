// Sistema de permissões baseado em níveis de acesso
export type AccessLevel = 'operations' | 'management' | 'executive';

export interface PermissionConfig {
  dashboard: AccessLevel[];
  projects: AccessLevel[];
  board: AccessLevel[];
  team: AccessLevel[];
  availability: AccessLevel[];
  timeline: AccessLevel[];
  okrs: AccessLevel[];
  rituais: AccessLevel[];
  // Permissões específicas
  viewHourlyRates: AccessLevel[];
  editHourlyRates: AccessLevel[];
  viewProjectCosts: AccessLevel[];
  managePermissions: AccessLevel[];
}

// Configuração de permissões conforme feedback da funcionária
export const PERMISSIONS: PermissionConfig = {
  // Time de Operações: acesso apenas a Board, Disponibilidade, Timeline, OKR e Rituais
  // Sócios, Heads e Gerentes: acesso total (full) ao dashboard
  dashboard: ['management', 'executive'],
  projects: ['management', 'executive'],
  board: ['operations', 'management', 'executive'],
  team: ['management', 'executive'],
  availability: ['operations', 'management', 'executive'],
  timeline: ['operations', 'management', 'executive'],
  okrs: ['operations', 'management', 'executive'],
  rituais: ['operations', 'management', 'executive'],
  
  // Permissões financeiras - apenas para Sócios e Heads
  viewHourlyRates: ['executive'],
  editHourlyRates: ['executive'],
  viewProjectCosts: ['management', 'executive'],
  managePermissions: ['executive'],
};

// Mapeamento de cargos para níveis de acesso
export const POSITION_TO_ACCESS_LEVEL: Record<string, AccessLevel> = {
  // Time de Operações
  'Desenvolvedor': 'operations',
  'Designer': 'operations',
  'Analista': 'operations',
  'Estagiário': 'operations',
  'Junior': 'operations',
  'QA': 'operations',
  'Especialista': 'operations',
  
  // Management
  'Tech Lead': 'management',
  'Gerente': 'management',
  'Head': 'management',
  'Coordenador': 'management',
  'Senior': 'management',
  'CSM': 'management',
  
  // Executive
  'Sócio': 'executive',
  'CEO': 'executive',
  'CTO': 'executive',
  'Diretor': 'executive',
};

// Hook para verificar permissões
export function hasPermission(
  userAccessLevel: AccessLevel,
  requiredPermission: keyof PermissionConfig
): boolean {
  const allowedLevels = PERMISSIONS[requiredPermission];
  return allowedLevels.includes(userAccessLevel);
}

// Função para determinar nível de acesso baseado no cargo
export function getAccessLevelFromPosition(position: string): AccessLevel {
  // Busca exata primeiro
  if (POSITION_TO_ACCESS_LEVEL[position]) {
    return POSITION_TO_ACCESS_LEVEL[position];
  }
  
  // Busca por palavras-chave
  const positionLower = position.toLowerCase();
  
  if (positionLower.includes('sócio') || positionLower.includes('ceo') || 
      positionLower.includes('cto') || positionLower.includes('diretor')) {
    return 'executive';
  }
  
  if (positionLower.includes('head') || positionLower.includes('gerente') || 
      positionLower.includes('lead') || positionLower.includes('coordenador') ||
      positionLower.includes('senior')) {
    return 'management';
  }
  
  // Default para operations
  return 'operations';
}

// Labels amigáveis para os níveis
export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  operations: 'Time de Operações',
  management: 'Gerência/Heads',
  executive: 'Sócios/Diretoria',
};

// Lista de cargos sugeridos
export const SUGGESTED_POSITIONS = [
  'Desenvolvedor',
  'Desenvolvedor Senior',
  'Tech Lead',
  'Designer',
  'Designer Senior',
  'Analista',
  'Analista Senior',
  'QA',
  'CSM',
  'Especialista',
  'Gerente',
  'Head de Tecnologia',
  'Head de Growth',
  'Coordenador',
  'Sócio',
  'CEO',
  'CTO',
  'Diretor',
  'Estagiário',
];
