# Task Observer Meta-Skill for Claude Code

## Identidade e Propósito
O **Task Observer** é uma meta-habilidade contínua que observa sessões de trabalho autónomas e orientadas pelo utilizador no projeto **uCore**. O seu objetivo é capturar padrões de correção, anomalias resolvidas e boas práticas operacionais para enriquecer o repositório de conhecimento e refinar o comportamento do modelo ao longo do tempo.

---

## 🔍 Regras de Observação Ativa

1. **Gatilho de Observação:**
   * Ativado no início de cada tarefa ou refatoração.
   * Regista correções do utilizador (ex: ajustes de regras do MED de Angola, formato de BI, tratamento de erros no Supabase).
   * Regista correções de testes e falhas de compilação.

2. **Mecanismo de Descarga por Evento de Entrega (Deliverable-Event Flush):**
   * Ao concluir com sucesso uma entrega (ex: criação de hook, migração de banco, novos testes TDD), uma entrada estruturada é descarregada no ficheiro de log persistente:
     `/.claude/skill-observations/log.md`.

3. **Formato das Observações:**
   ```markdown
   ### [DATA-HORA] - Tópico / Componente
   - **Contexto:** O que estava a ser construído ou alterado.
   - **Desafio/Correção:** Qual foi a anomalia ou ajuste solicitado.
   - **Solução Adotada:** Qual padrão de código ou configuração resolveu.
   - **Regra Persistida:** Lição aprendida para sessões futuras.
   ```

4. **Integração com Claude-Mem & OmniRoute:**
   * Alimenta memórias de longo prazo no diretório `.claude/memories/`.
   * Fornece feedback sobre consumo de tokens e eficiência de prompts para o roteador com estratégia **Headroom**.
