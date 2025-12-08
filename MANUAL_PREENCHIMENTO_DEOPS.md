# 📋 MANUAL DE PREENCHIMENTO - DeOps Caaqui

## 🎯 **Para: Analista responsável**
Este documento explica como preencher e manter atualizado o sistema DeOps da Caaqui.

---

## 🏠 **1. ACESSO AO SISTEMA**

**URL:** https://caaquigestao.netlify.app/
1. Acesse o link
2. Clique na aba **"⚙️ DeOps"**
3. Você verá o painel principal com 7 módulos

---

## 📚 **2. MÓDULO PLAYBOOKS**
**Responsabilidade:** Manter processos atualizados

### **O que fazer:**
- **Revisar mensalmente** cada playbook
- **Atualizar SLAs** quando necessário
- **Adicionar novos processos** conforme surgem

### **Como atualizar:**
1. Clique em **"📚 Playbooks"**
2. Revise cada seção:
   - Playbook Geral (SLAs internos)
   - Playbook CRM (calendário padrão)
   - Playbook Martech (templates)
   - Playbook Growth (framework)
   - Playbook Tech (conexões)

---

## 🚀 **3. MÓDULO PRODUTOS**
**Responsabilidade:** Manter portfólio atualizado

### **O que fazer:**
- **Atualizar status** dos produtos
- **Adicionar novos produtos** quando lançados
- **Revisar descrições** trimestralmente

### **Produtos atuais:**
- **CRM** (core - assinatura)
- **Martech** (implementações)
- **Growth** (Apps, ASA, UA)
- **Tech** (Squads + integrações)
- **EcomAudit** (SaaS)
- **Bridge** (SDK atribuição)
- **ProjectOps** (interno)

---

## 👥 **4. MÓDULO CLIENTES**
**Responsabilidade:** Atualizar DIARIAMENTE

### **O que fazer:**
1. **Atualizar status** dos clientes:
   - Ativo
   - Onboarding
   - Diagnóstico
   - Bloqueado

2. **Preencher informações:**
   - Produto contratado
   - Squad responsável
   - Próxima weekly
   - Sprint atual
   - Progresso (%)

### **Status possíveis:**
- 🟢 **Ativo** - Cliente em operação normal
- 🔵 **Onboarding** - Novo cliente em processo inicial
- 🟡 **Diagnóstico** - Em fase de análise
- 🔴 **Bloqueado** - Com impedimentos

### **Exemplo de preenchimento:**
```
Cliente: [Nome] - [Segmento]
Status: [Ativo/Onboarding/Diagnóstico/Bloqueado]
Produto: [CRM + Martech]
Squad: [CRM Lead + Analista]
Próxima Weekly: [Dia e horário]
Sprint Atual: [Descrição da sprint]
Progresso: [% ou descrição]
```

---

## 📋 **5. MÓDULO PROJETOS**
**Responsabilidade:** Atualizar SEMANALMENTE (toda segunda-feira)

### **O que fazer:**
1. **Criar nova sprint** toda segunda
2. **Atualizar progresso** das tarefas
3. **Marcar como concluído** quando finalizar

### **Status das tarefas:**
- 🟢 **Concluído**
- 🟡 **Em progresso**
- ⚪ **Pendente**

### **Fluxo padrão:**
1. Kickoff → 2. Diagnóstico → 3. Sprint 1 → 4. Execução → 5. QA → 6. Entrega → 7. Handoff

### **Exemplo de sprint:**
```
Sprint [Número] - [Cliente]
Objetivo: [Descrição clara do objetivo]
Squad: [Responsáveis]
Prazo: [Data limite]

Tarefas:
□ [Tarefa 1] - Pendente
🟡 [Tarefa 2] - Em progresso
✅ [Tarefa 3] - Concluído
```

---

## 🏛️ **6. MÓDULO GOVERNANÇA**
**Responsabilidade:** Revisar MENSALMENTE

### **O que verificar:**
- **SLAs internos** estão sendo cumpridos
- **Cadência semanal** está funcionando
- **Regras de comunicação** estão claras
- **Regras de ouro** estão sendo seguidas

### **SLAs para monitorar:**
- Brief: 24h ✅/❌
- Demandas pequenas: 48-72h ✅/❌
- Demandas médias: 5 dias ✅/❌
- Demandas grandes: sprint dedicada ✅/❌

---

## 📊 **7. MÓDULO DADOS**
**Responsabilidade:** Auditoria SEMANAL (toda sexta)

### **O que fazer:**
1. **Executar checklist** de auditoria semanal
2. **Verificar eventos** GA4, AppsFlyer, Bridge
3. **Reportar problemas** encontrados

### **Checklist semanal:**
- [ ] Eventos ativos funcionando
- [ ] Eventos quebrados identificados
- [ ] Eventos sem parâmetros obrigatórios
- [ ] Links não funcionando
- [ ] UTMs inválidas
- [ ] Problemas de sessão

---

## 👨‍💼 **8. MÓDULO TIME**
**Responsabilidade:** Atualizar quando houver mudanças

### **O que manter:**
- **RACI atualizado** por área
- **Competências** de cada disciplina
- **Responsabilidades** claras

---

## 📅 **9. ROTINA SEMANAL SUGERIDA**

### **Segunda-feira:**
- Atualizar módulo **Projetos** (novas sprints)
- Verificar **Clientes** (status e próximas weeklies)
- Usar atalhos rápidos do HOME

### **Terça a Quinta:**
- Atualizar **progresso** dos projetos
- Monitorar **bloqueios** de clientes
- Registrar **entregas** realizadas

### **Sexta-feira:**
- Executar **auditoria semanal** (Dados)
- Preparar **relatórios** da semana
- Atualizar **últimas atualizações** no HOME

---

## 🔧 **10. ATALHOS RÁPIDOS (HOME)**

Use os botões do painel HOME para:
- ➕ **Criar Projeto** - Novo projeto/cliente
- 🚀 **Iniciar Sprint** - Nova sprint semanal
- 🔍 **Criar Diagnóstico** - Novo diagnóstico
- 📋 **Abrir RACI** - Verificar responsabilidades
- 👥 **Onboarding Cliente** - Novo cliente
- 📊 **Weekly Report** - Relatório semanal
- 🔧 **QA Checklist** - Checklist de qualidade
- 📈 **Ver Métricas** - Métricas gerais

---

## ⚠️ **11. REGRAS IMPORTANTES**

### **Nunca esquecer:**
1. **Tudo documentado** no DeOps
2. **Nada entregue** sem QA
3. **Nenhuma reunião** sem pauta
4. **Status atualizado** diariamente
5. **Cliente nunca pergunta** "e aí?"

### **Comunicação:**
- **Slack** → Comunicação interna
- **Email** → Assuntos formais
- **WhatsApp** → Emergência
- **DeOps** → Documentação oficial

---

## 🆘 **12. QUANDO ESCALAR**

### **Escalar para Líderes quando:**
- Cliente bloqueado há **mais de 2 dias**
- SLA não cumprido
- Problema técnico grave
- Mudança de escopo

### **Escalar para Founders quando:**
- Cliente bloqueado há **mais de 3 dias**
- Problema comercial
- Renovação em risco
- Conflito interno

---

## 📞 **13. SUPORTE**

**Dúvidas sobre o DeOps:**
- Consulte este manual primeiro
- Pergunte ao seu líder direto
- Documente melhorias sugeridas

**Lembre-se:** O DeOps é o **manual oficial** da Caaqui. Mantenha-o sempre atualizado!

---

*Última atualização: Dezembro 2024*
