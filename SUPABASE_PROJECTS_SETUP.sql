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
  -- Tipo de hora para DevOps: faturável, não faturável ou produto interno
  hour_type TEXT CHECK (hour_type IN ('billable', 'non_billable', 'product')) DEFAULT 'billable',
  -- Horas previstas por mês para esta alocação
  planned_hours_monthly INTEGER,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, collaborator_id, hour_type)
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
CREATE INDEX IF NOT EXISTS idx_project_allocations_hour_type ON project_allocations(hour_type);
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

-- Tabela de Sprints (histórico por projeto)
CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  name TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  objective TEXT,
  status TEXT CHECK (status IN ('planned', 'active', 'completed', 'cancelled')) DEFAULT 'planned',
  planned_hours_billable INTEGER,
  planned_hours_non_billable INTEGER,
  planned_hours_product INTEGER,
  retrospective TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Itens de Sprint (user stories / tarefas)
CREATE TABLE IF NOT EXISTS sprint_entries (
  id TEXT PRIMARY KEY,
  sprint_id TEXT NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collaborator_id TEXT REFERENCES collaborators(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('backlog', 'in_sprint', 'done', 'moved_backlog')) DEFAULT 'in_sprint',
  planned_hours INTEGER,
  spent_hours INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS nas novas tabelas de sprints
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_entries ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para MVP (todos podem ler/escrever)
CREATE POLICY "Enable all operations for all users" ON sprints FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON sprint_entries FOR ALL USING (true);

-- Índices para sprints
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);
CREATE INDEX IF NOT EXISTS idx_sprint_entries_sprint_id ON sprint_entries(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_entries_project_id ON sprint_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_sprint_entries_collaborator_id ON sprint_entries(collaborator_id);

-- Trigger para atualizar updated_at em sprints e sprint_entries
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON sprints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sprint_entries_updated_at BEFORE UPDATE ON sprint_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
