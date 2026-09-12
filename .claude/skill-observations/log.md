# Task Observer: Registo de Observações e Padrões Aprendidos

Este registo mantém a memória contínua das sessões de engenharia no projeto **uCore**, garantindo que correções e preferências do utilizador nunca sejam esquecidas entre diferentes sessões.

---

### [2026-09-12T07:30:00Z] - Normalização de Pautas para o Padrão de Angola (MED)
- **Contexto:** Lançamento de notas na Turma 1 da Escola Nº 1024.
- **Desafio/Correção:** Garantir que o sistema não use escala 0-10 ou letras americanas (A/B/C), mas sim a escala oficial angolana de 0 a 20 valores.
- **Solução Adotada:** Implementadas colunas `p1`, `p2`, `trabalho` e `media` com validações `CHECK (media >= 0 AND media <= 20)` e cálculo de média ponderada por trimestre.
- **Regra Persistida:** Todas as telas e pautas devem sempre apresentar notas no intervalo de 0 a 20.

---

### [2026-09-12T07:45:00Z] - Resiliência do Cliente Supabase entre Ambientes Vite e Node
- **Contexto:** Execução dos testes automatizados com `tsx --test` vs execução no navegador via Vite.
- **Desafio/Correção:** No Node.js puro, `import.meta.env` gerava `TypeError: Cannot read properties of undefined`.
- **Solução Adotada:** Criada função `getEnvVar` com fallback seguro entre `import.meta.env` e `process.env`.
- **Regra Persistida:** Nunca aceder a `import.meta.env` diretamente em ficheiros partilhados com testes em backend sem o wrapper seguro.

---

### [2026-09-12T08:20:00Z] - Normalização de Erros do Supabase no Hook `useSupabase`
- **Contexto:** Tratamento de erros de violação de RLS e duplicidade de dados no Supabase.
- **Desafio/Correção:** Evitar que erros técnicos crus do Postgres sejam mostrados ao utilizador ou causem travamentos no React.
- **Solução Adotada:** Criada a função `formatSupabaseError` que mapeia códigos de erro (23505, 23503, 42501, NetworkError) em mensagens amigáveis em português.
- **Regra Persistida:** Sempre retornar o objeto `{ success, data, error }` nos métodos de CRUD.

---

### [2026-09-12T08:28:00Z] - Ativação do Stack OmniRoute + Claude-Mem + Headroom + Task Observer
- **Contexto:** Implementação do ecossistema avançado de IA para Claude Code.
- **Solução Adotada:** Configurados `CLAUDE.md`, `.claude/config.json`, `.claude/settings.json`, `omniroute.config.json` com estratégia de Headroom e diretório `.claude/memories/`.
