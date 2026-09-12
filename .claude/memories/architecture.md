# Claude-Mem: Arquitetura Persistente do uCore

## Visão Geral
* **Domínio:** Gestão Escolar e Lançamento de Pautas (Normas MED Angola / SSD).
* **Escala de Avaliação:** 0 a 20 valores (Aprovação $\ge 10.0$, Quadro de Honra $\ge 16.0$).
* **Identificação:** Bilhete de Identidade Angolano rigoroso (14 carateres: 9 dígitos + 2 letras + 3 dígitos).

## Estrutura do Banco de Dados (Supabase PostgreSQL)
* **Tabelas Principais:** `schools`, `profiles`, `teachers`, `turmas`, `subjects`, `turma_subjects`, `students`, `student_grades`, `attendance_records`, `announcements`, `audit_logs`.
* **Segurança:** RLS ativo em 100% das tabelas.
* **Views de Análise:** `vw_pauta_turma` e `vw_estatisticas_turma`.
* **Trigger:** `recalcular_presenca_aluno` recalcula assiduidade automaticamente no diário.

## Frontend & State Management
* **Hook React:** `useSupabase` em `/src/hooks/useSupabase.ts` encapsulando CRUD e tratamento amigável de erros.
* **Cliente:** `/src/lib/supabaseClient.ts` com fallback resiliente entre Node.js e Vite.
