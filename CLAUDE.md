# CLAUDE.md - uCore Educational Platform Guidelines

Bem-vindo ao **uCore**, o Sistema Operacional de Gestão Escolar e Avaliação Académica desenhado para instituições de ensino e em conformidade com as normas oficiais do **Ministério da Educação de Angola (MED)**.

---

## 🛠️ Comandos de Desenvolvimento e Validação

```bash
# Executar a aplicação em modo de desenvolvimento
npm run dev

# Validação de sintaxe e TypeScript sem emitir ficheiros
npm run lint

# Executar a suíte de testes automatizados (SSD / TDD / Supabase)
npm test

# Compilação de produção
npm run build
```

---

## 🏛️ Arquitetura do Projeto

* **Frontend:** React 19 com TypeScript, Vite, Tailwind CSS v4 e Lucide Icons.
* **Backend & Base de Dados:** Supabase (PostgreSQL 15+) com Row Level Security (RLS) habilitado em 100% das tabelas.
* **Sincronização em Tempo Real:** Supabase Realtime para pautas, presenças e comunicados.
* **Armazenamento:** Supabase Storage (`student-photos`, `student-documents`).
* **Segurança e Conformidade:** Safe Software Development (SSD) com proteção IDOR, Rate Limiting e Trilha de Auditoria (`audit_logs`).

---

## 📋 Regras de Negócio e Convenções Oficiais de Angola

1. **Escala de Avaliação:** A escala oficial de notas em Angola é de **0 a 20 valores**. Notas $\ge 10.0$ são consideradas aprovação; $\ge 16.0$ qualificam para o Quadro de Honra.
2. **Trimestres:** O ano letivo é composto por 3 trimestres (1º, 2º e 3º Trimestre). A nota de cada trimestre é derivada de **P1**, **P2** e **Trabalho**, gerando a **Média Trimestral**.
3. **Identificação Angolana:** O Bilhete de Identidade (BI) possui formato estrito de 14 caracteres: 9 dígitos numéricos, 2 letras maiúsculas e 3 dígitos finais (ex: `008941215LA041`).
4. **Documentos de Alunos:** Tipos suportados: `'BI'`, `'Cedula pessoal'`, `'Assento'` ou `'sem Documento'`.

---

## 🗄️ Estrutura de Diretórios

* `/src/lib/supabaseClient.ts`: Cliente resiliente com suporte tanto a Vite como a Node.js.
* `/src/hooks/useSupabase.ts`: Hook reativo para operações de CRUD com tratamento automático de erros e tradução de códigos do PostgreSQL.
* `/src/tests/`: Testes automatizados TDD de integridade referencial, proteção IDOR, validação de BI e cliente Supabase.
* `/supabase/schema.sql`: DDL completo com todas as 10 tabelas, relacionamentos e RLS.
* `/supabase/advanced_features.sql`: Ativação do Realtime, Storage Buckets e Views de pauta consolidada.

---

## 🤖 Integrações de IA & Claude Code Stack

* **OmniRoute:** Gateway universal de modelos com estratégia **Headroom-Based** para otimização de tokens e compressão de prompts.
* **Claude-Mem:** Gestor de memória persistente entre sessões de código (`.claude/memories/`).
* **Task Observer:** Observador contínuo de tarefas que regista boas práticas e correções na trilha `.claude/skill-observations/log.md`.
* **Headroom Management:** Margem de segurança de contexto configurada em 25% para evitar cortes de contexto ou degradação de raciocínio.
