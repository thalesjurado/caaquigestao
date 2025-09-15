# 🚀 Configuração do Supabase - Passo a Passo

## 1. Criar Conta e Projeto
1. Acesse https://supabase.com
2. Faça login com GitHub (@caaqui)
3. Clique em "New Project"
4. Nome: `caaqui-projectops`
5. Escolha uma senha forte para o banco
6. Região: South America (São Paulo)

## 2. Obter Credenciais
1. Vá em Settings > API
2. Copie:
   - **Project URL**: `https://seu-projeto.supabase.co`
   - **Anon/Public Key**: `eyJ...` (chave longa)

## 3. Criar arquivo .env.local
Na raiz do projeto, crie `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ_sua_chave_aqui
```

## 4. Criar Tabelas no Banco
1. Vá em "SQL Editor" no Supabase
2. Cole e execute este SQL:

```sql
-- Board Activities
CREATE TABLE board_activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('todo', 'doing', 'done')) NOT NULL,
  assignee_id TEXT,
  description TEXT,
  client TEXT,
  points INTEGER,
  subtasks TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaborators
CREATE TABLE collaborators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OKRs
CREATE TABLE okrs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  activities JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rituals
CREATE TABLE rituals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) - Opcional para MVP
ALTER TABLE board_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rituals ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para MVP (todos podem ler/escrever)
CREATE POLICY "Enable all operations for all users" ON board_activities FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON collaborators FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON okrs FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON rituals FOR ALL USING (true);
```

## 5. Testar Conexão
Após configurar, o sistema irá:
- ✅ Conectar automaticamente ao Supabase
- ✅ Sincronizar dados entre todos os usuários
- ✅ Manter dados persistentes na nuvem

## ⚠️ Importante
- Mantenha o `.env.local` privado (já está no .gitignore)
- As credenciais são públicas (anon key) mas seguras para frontend
- Dados serão compartilhados entre todos que acessarem a aplicação

## 🔄 Próximos Passos
Após configurar, me avise que vou:
1. Ativar o novo store com Supabase
2. Migrar dados existentes (se houver)
3. Testar sincronização
4. Fazer deploy da versão compartilhada
