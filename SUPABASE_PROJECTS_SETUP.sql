-- SQL para criar as novas tabelas de Projetos e Alocações
-- Execute este script no SQL Editor do Supabase

-- Atualizar tabela board_activities para incluir novos campos
ALTER TABLE board_activities 
ADD COLUMN IF NOT EXISTS project_id TEXT,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Atualizar status para incluir novos valores
ALTER TABLE board_activities 
DROP CONSTRAINT IF EXISTS board_activities_status_check;

ALTER TABLE board_activities 
ADD CONSTRAINT board_activities_status_check 
CHECK (status IN ('backlog', 'todo', 'doing', 'done', 'historical'));

-- Tabela de Projetos
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  type TEXT CHECK (type IN ('tech_implementation', 'growth_agency')) NOT NULL,
  status TEXT CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  description TEXT,
  budget DECIMAL(10,2),
  tech_details JSONB,
  growth_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Alocações de Projeto
CREATE TABLE IF NOT EXISTS project_allocations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collaborator_id TEXT NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  role TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, collaborator_id)
);

-- Atualizar tabela collaborators para incluir novos campos
ALTER TABLE collaborators 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS max_allocation INTEGER DEFAULT 100;

-- Atualizar tabela okrs para incluir quarter
ALTER TABLE okrs 
ADD COLUMN IF NOT EXISTS quarter TEXT DEFAULT 'Q1 2025';

-- Habilitar RLS nas novas tabelas
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_allocations ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para MVP (todos podem ler/escrever)
CREATE POLICY "Enable all operations for all users" ON projects FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON project_allocations FOR ALL USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_project_allocations_project_id ON project_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_allocations_collaborator_id ON project_allocations(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_board_activities_project_id ON board_activities(project_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_allocations_updated_at BEFORE UPDATE ON project_allocations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
