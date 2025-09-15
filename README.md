# Caaqui ProjectOps

Sistema leve para governança de projetos, squads e OKRs desenvolvido com Next.js 15.

## 🚀 Funcionalidades

### 📊 Dashboard
- Visão geral com métricas de projetos ativos
- Gráficos de velocidade da equipe (pontos/semana)
- Análise de utilização por função e pessoa
- Indicadores de risco e projetos no prazo
- Exportação de dados em JSON

### 📋 Board Kanban
- Sistema de arrastar e soltar para gerenciar tarefas
- 5 colunas: Backlog → A Fazer → Em Progresso → Em Revisão → Concluído
- Campos customizáveis: Cliente, Projeto, Pilar, Pontos, Data de entrega
- Atribuição de responsáveis
- Filtragem e organização visual

### 🎯 OKRs (Objectives and Key Results)
- Criação de até 5 OKRs por projeto
- Cada OKR pode ter até 5 atividades
- Atribuição de responsáveis às atividades
- Acompanhamento visual do progresso

### 📅 Rituais
- Gerenciamento de rituais da equipe
- Anotações e documentação de cada ritual
- Sistema de notas persistentes

### 👥 Equipe
- Cadastro de colaboradores com nome, função e email
- Visualização de carga de trabalho por pessoa
- Contagem automática de atividades atribuídas
- Edição e remoção com confirmação

## 🛠️ Tecnologias

- **Next.js 15** com App Router e Turbopack
- **React 19** com hooks modernos
- **TypeScript** para type safety
- **Tailwind CSS 4** para estilização
- **Zustand** para gerenciamento de estado
- **Recharts** para gráficos e visualizações
- **Radix UI** para componentes acessíveis

## ✨ Funcionalidades Técnicas

### 💾 Persistência Local
- Dados salvos automaticamente no localStorage
- Sincronização em tempo real entre abas
- Backup automático a cada alteração

### 🔔 Sistema de Notificações
- Toasts animados para feedback das ações
- Notificações de sucesso, erro e informação
- Animações suaves de entrada e saída

### 📱 Responsividade
- Design mobile-first
- Interface adaptável para todos os dispositivos
- Navegação otimizada para touch

### ⚡ Performance
- Carregamento dinâmico de componentes
- Otimizações de rendering com useMemo
- Bundle splitting automático

## 🚀 Como Executar

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd caaqui-projectops
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute o servidor de desenvolvimento**
```bash
npm run dev
```

4. **Acesse a aplicação**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento com Turbopack
- `npm run build` - Gera build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa linting do código
- `npm run type-check` - Verifica tipos TypeScript

## 🏗️ Estrutura do Projeto

```
├── app/
│   ├── components/          # Componentes React
│   │   ├── Board.tsx       # Sistema Kanban
│   │   ├── Dashboard.tsx   # Dashboard principal
│   │   ├── OKRs.tsx        # Gerenciamento de OKRs
│   │   ├── Rituais.tsx     # Rituais da equipe
│   │   ├── Team.tsx        # Gerenciamento de equipe
│   │   └── Toast.tsx       # Sistema de notificações
│   ├── globals.css         # Estilos globais
│   ├── layout.tsx          # Layout principal
│   └── page.tsx            # Página inicial
├── lib/
│   ├── appStore.ts         # Store Zustand
│   ├── sync.ts             # Sincronização de dados
│   ├── toast.ts            # Sistema de toasts
│   └── validation.ts       # Validações
└── public/                 # Arquivos estáticos
```

## 💡 Uso

1. **Dashboard**: Visualize métricas gerais e exporte dados
2. **Board**: Gerencie tarefas no sistema Kanban
3. **OKRs**: Defina objetivos e acompanhe atividades
4. **Rituais**: Documente reuniões e processos da equipe
5. **Equipe**: Cadastre colaboradores e visualize cargas de trabalho

## 🔧 Configurações

O projeto usa configurações otimizadas para:
- **Tailwind CSS 4** com design system customizado
- **TypeScript** com strict mode habilitado
- **Next.js** com experimental Turbopack
- **ESLint** com regras do Next.js

## 📦 Build e Deploy

Para fazer deploy em produção:

```bash
npm run build
npm run start
```

O projeto está configurado para deploy em plataformas como Vercel, Netlify ou qualquer servidor Node.js.

---

**Desenvolvido para otimizar a governança de projetos e equipes** 🚀
