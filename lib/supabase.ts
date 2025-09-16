import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohanjvrxywgreokkeckd.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

// Debug das variáveis de ambiente
console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey && supabaseAnonKey !== 'your-anon-key'
});

// Teste de conexão simples
export const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    const { data, error } = await supabase.from('board_activities').select('count', { count: 'exact' });
    
    if (error) {
      console.error('❌ Erro na conexão:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status: (error as { status?: string }).status || 'N/A'
      });
      return false;
    }
    
    console.log('✅ Conexão OK - board_activities:', data);
    return true;
  } catch (err) {
    console.error('❌ Erro de conexão geral:', err);
    return false;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas
export interface SupabaseBoardActivity {
  id: string
  title: string
  status: 'backlog' | 'todo' | 'doing' | 'done' | 'historical'
  assignee_id?: string
  description?: string
  client?: string
  points?: number
  subtasks?: string[]
  created_at?: string
  updated_at?: string
}

export interface SupabaseCollaborator {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  created_at?: string
  updated_at?: string
}

export interface SupabaseOKR {
  id: string
  title: string
  description: string
  progress: number
  activities?: Array<{
    id: string;
    title: string;
    assigneeId?: string;
  }>
  created_at?: string
  updated_at?: string
}

export interface SupabaseRitual {
  id: string
  title: string
  content?: string
  frequency?: string
  next_date?: string
  created_at?: string
  updated_at?: string
}

// Novos tipos para projetos e alocações
export interface SupabaseProject {
  id: string
  name: string
  client: string
  type: 'tech_implementation' | 'growth_agency'
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  start_date: string
  end_date: string
  description?: string
  budget?: number
  tech_details?: {
    sdkType?: string
    cdpIntegration?: string
    martechTools?: string[]
  }
  growth_details?: {
    crmPlatform?: string
    campaignType?: string
    expectedResults?: string
  }
  created_at?: string
  updated_at?: string
}

export interface SupabaseProjectAllocation {
  id: string
  project_id: string
  collaborator_id: string
  percentage: number
  role: string
  start_date: string
  end_date: string
  created_at?: string
  updated_at?: string
}

// Funções para Board Activities
export const boardActivitiesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('board_activities')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro detalhado boardActivities:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    return data || []
  },

  async create(activity: Omit<SupabaseBoardActivity, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('board_activities')
      .insert([{
        ...activity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<SupabaseBoardActivity>) {
    const { data, error } = await supabase
      .from('board_activities')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('board_activities')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Funções para Collaborators
export const collaboratorsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('collaborators')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('❌ Erro detalhado collaborators:', error);
      throw error;
    }
    return data || []
  },

  async create(collaborator: Omit<SupabaseCollaborator, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('collaborators')
      .insert([{
        ...collaborator,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<SupabaseCollaborator>) {
    const { data, error } = await supabase
      .from('collaborators')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('collaborators')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Funções para OKRs
export const okrsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('okrs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro detalhado okrs:', error);
      throw error;
    }
    return data || []
  },

  async create(okr: Omit<SupabaseOKR, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('okrs')
      .insert([{
        ...okr,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<SupabaseOKR>) {
    const { data, error } = await supabase
      .from('okrs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('okrs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Funções para Rituals
export const ritualsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('rituals')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro detalhado rituals:', error);
      throw error;
    }
    return data || []
  },

  async create(ritual: Omit<SupabaseRitual, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('rituals')
      .insert([{
        ...ritual,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<SupabaseRitual>) {
    const { data, error } = await supabase
      .from('rituals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('rituals')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Funções para Projects
export const projectsAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Erro detalhado projects:', error);
        
        // Se a tabela não existe, retorna array vazio para usar fallback
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('⚠️ Tabela projects não encontrada, usando fallback');
          return [];
        }
        
        throw error;
      }
      return data || []
    } catch (err) {
      console.error('❌ Erro ao acessar projects:', err);
      return [];
    }
  },

  async create(project: Omit<SupabaseProject, 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...project,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) {
        console.warn('⚠️ Erro ao criar project no Supabase, salvando no localStorage');
        // Fallback para localStorage
        const newProject = {
          ...project,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const existingProjects = JSON.parse(localStorage.getItem('caaqui_projects') || '[]');
        existingProjects.push(newProject);
        localStorage.setItem('caaqui_projects', JSON.stringify(existingProjects));
        
        return newProject;
      }
      return data;
    } catch (err) {
      console.error('❌ Erro ao criar project:', err);
      throw err;
    }
  },

  async update(id: string, updates: Partial<SupabaseProject>) {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Funções para Project Allocations
export const projectAllocationsAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('project_allocations')
        .select(`
          *,
          projects(name, client),
          collaborators(name, role)
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Erro detalhado project_allocations:', error);
        
        // Se a tabela não existe, retorna array vazio para usar fallback
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('⚠️ Tabela project_allocations não encontrada, usando fallback');
          return [];
        }
        
        throw error;
      }
      return data || []
    } catch (err) {
      console.error('❌ Erro ao acessar project_allocations:', err);
      return [];
    }
  },

  async getByProject(projectId: string) {
    const { data, error } = await supabase
      .from('project_allocations')
      .select(`
        *,
        collaborators(name, role, email)
      `)
      .eq('project_id', projectId)
    
    if (error) throw error
    return data || []
  },

  async getByCollaborator(collaboratorId: string) {
    const { data, error } = await supabase
      .from('project_allocations')
      .select(`
        *,
        projects(name, client, end_date)
      `)
      .eq('collaborator_id', collaboratorId)
    
    if (error) throw error
    return data || []
  },

  async create(allocation: Omit<SupabaseProjectAllocation, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('project_allocations')
      .insert([{
        ...allocation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<SupabaseProjectAllocation>) {
    const { data, error } = await supabase
      .from('project_allocations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('project_allocations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
