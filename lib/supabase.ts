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
        status: (error as any).status || 'N/A'
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
  status: 'todo' | 'doing' | 'done'
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
