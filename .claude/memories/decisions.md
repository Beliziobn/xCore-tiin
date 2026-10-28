# Claude-Mem: Registo de Decisões de Arquitetura (ADRs)

### ADR 001 - Adoção da Escala 0-20 do Ministério da Educação de Angola
* **Data:** 2026-09-12
* **Decisão:** Abandonar escalas 0-10 ou percentuais e adotar estritamente a escala 0 a 20 valores oficial de Angola com cálculo de P1, P2 e Trabalho no 1º, 2º e 3º Trimestre.
* **Impacto:** Todas as validações no frontend e no banco (check constraints) garantem integridade legal.

### ADR 002 - PostgreSQL & Supabase com Row Level Security (RLS)
* **Data:** 2026-09-12
* **Decisão:** Manter 100% das tabelas protegidas por RLS.
* **Impacto:** Previne vulnerabilidades IDOR entre turmas, diretores e alunos.

### ADR 003 - Hook React `useSupabase` com Normalização de Erros
* **Data:** 2026-09-12
* **Decisão:** Centralizar todas as operações de banco em `useSupabase` com tradução de códigos do Postgres (23505, 23503, 42501) para mensagens humanas em português.
* **Impacto:** O frontend nunca quebra com exceções não tratadas.
