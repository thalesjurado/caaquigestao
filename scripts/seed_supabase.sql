-- Seed consolidado para Caaqui ProjectOps
-- Execute no SQL Editor do Supabase (rodar tudo de uma vez)

-- ================================
-- 1) Tabelas base
-- ================================
CREATE TABLE IF NOT EXISTS board_activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  assignee_id TEXT,
  description TEXT,
  client TEXT,
  points INTEGER,
  subtasks TEXT[],
  project_id TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajusta o conjunto de status permitido
ALTER TABLE board_activities 
  DROP CONSTRAINT IF EXISTS board_activities_status_check;
ALTER TABLE board_activities 
  ADD CONSTRAINT board_activities_status_check 
  CHECK (status IN ('backlog','todo','doing','done','historical'));

CREATE TABLE IF NOT EXISTS collaborators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  hourly_rate DECIMAL(8,2),
  max_allocation INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS okrs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  activities JSONB DEFAULT '[]',
  quarter TEXT DEFAULT 'Q1 2025',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rituals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  frequency TEXT,
  next_date TIMESTAMPTZ,
  project_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 2) Tabelas de projetos e alocações
-- ================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  type TEXT CHECK (type IN ('tech_implementation','growth_agency')) NOT NULL,
  status TEXT CHECK (status IN ('planning','active','on_hold','completed','cancelled')) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  description TEXT,
  budget DECIMAL(10,2),
  tech_details JSONB,
  growth_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ================================
-- 3) RLS e políticas permissivas (MVP)
-- ================================
ALTER TABLE board_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_allocations ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas e recria permissivas
DROP POLICY IF EXISTS "Enable all operations for all users" ON board_activities;
CREATE POLICY "Enable all operations for all users" ON board_activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all operations for all users" ON collaborators;
CREATE POLICY "Enable all operations for all users" ON collaborators FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all operations for all users" ON okrs;
CREATE POLICY "Enable all operations for all users" ON okrs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all operations for all users" ON rituals;
CREATE POLICY "Enable all operations for all users" ON rituals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all operations for all users" ON projects;
CREATE POLICY "Enable all operations for all users" ON projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all operations for all users" ON project_allocations;
CREATE POLICY "Enable all operations for all users" ON project_allocations FOR ALL USING (true) WITH CHECK (true);

-- ================================
-- 4) Índices para performance
-- ================================
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_project_allocations_project_id ON project_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_allocations_collaborator_id ON project_allocations(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_board_activities_project_id ON board_activities(project_id);

-- ================================
-- 5) Trigger updated_at automática
-- ================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_allocations_updated_at ON project_allocations;
CREATE TRIGGER update_project_allocations_updated_at
  BEFORE UPDATE ON project_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- 6) Seed mínimo para validação
-- ================================
-- Colaboradores
INSERT INTO collaborators (id, name, email, role, avatar)
VALUES
  ('u1','Alice','alice@caaqui.com','PM', NULL),
  ('u2','Bruno','bruno@caaqui.com','Dev', NULL)
ON CONFLICT (id) DO NOTHING;

-- Projetos
INSERT INTO projects (id, name, client, type, status, start_date, end_date, description)
VALUES
  ('p1','Implementação SDK','Cliente X','tech_implementation','active', NOW() - INTERVAL '7 days', NOW() + INTERVAL '14 days','Projeto técnico'),
  ('p2','Crescimento Performance','Cliente Y','growth_agency','planning', NOW(), NOW() + INTERVAL '30 days','Campanhas de growth')
ON CONFLICT (id) DO NOTHING;

-- Alocações
INSERT INTO project_allocations (id, project_id, collaborator_id, percentage, role, start_date, end_date)
VALUES
  ('a1','p1','u2',50,'Dev', NOW() - INTERVAL '7 days', NOW() + INTERVAL '14 days')
ON CONFLICT (id) DO NOTHING;

-- Board activities
INSERT INTO board_activities (id, title, status, assignee_id, client, points, project_id)
VALUES
  ('t1','Configurar SDK','doing','u2','Cliente X',3,'p1'),
  ('t2','Planejar campanha','todo',NULL,'Cliente Y',5,'p2')
ON CONFLICT (id) DO NOTHING;

-- OKRs
INSERT INTO okrs (id, title, description, progress, activities)
VALUES
  ('okr1','Acelerar entregas','Reduzir lead time',10,'[]')
ON CONFLICT (id) DO NOTHING;

-- Rituals
INSERT INTO rituals (id, title, content)
VALUES
  ('r1','Daily','Notas da daily')
ON CONFLICT (id) DO NOTHING;
