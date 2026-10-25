# Relatório Mestre v4 — Auditoria, Simplificação, Otimização e Evolução Integral de UI/UX
**Projeto:** SIGRE — Sistema Integrado de Gestão Escolar (Angola)  
**Estado Final:** `concluido_no_escopo`  
**Data:** 2026-10-25  

---

## 1. Resultado e Estado Final (Seção 40.1)

- **Objetivo:** Executar o ciclo completo do **Prompt Mestre v4** (`descobrir → estabelecer baseline → diagnosticar → priorizar → definir critérios de aceitação → implementar → verificar → comparar → documentar → preparar continuidade`) em toda a plataforma SIGRE, preservando rigorosamente os contratos de negócio, dados persistidos, autenticação/autorização, identidade visual institucional e as customizações recentes (insígnia oficial da República de Angola nas Mini-Pautas e Pautas, organização limpa da barra de navegação e acesso às Declarações de Efectividade).
- **Escopo:** Aplicação integral (`src/index.css`, `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/pages/director/DirectorPautasPage.tsx`, `src/components/modals/PautaPdfExportModal.tsx` e consumidores associados).
- **Modo:** `implementacao` | **Profundidade:** `standard` | **Risco:** `equilibrado` | **Autonomia:** `autonoma`.
- **Estado Final:** `concluido_no_escopo`.

---

## 2. Parâmetros de Execução (Seção 40.2)

| Parâmetro | Valor | Fonte | Suposição ou Confirmação |
|---|---|---|---|
| `MODO` | `implementacao` | Solicitação explícita do utilizador | Confirmado |
| `PROFUNDIDADE` | `standard` | Padrão do Prompt Mestre v4 (Seção 1.1) | Confirmado |
| `ESCOPO` | Sistema inteiro SIGRE | Solicitação explícita ("todo o sistema inteiro") | Confirmado |
| `RISCO` | `equilibrado` | Padrão do Prompt Mestre v4 | Confirmado |
| `VARIANTE_LINGUISTICA` | `pt-AO` / `pt-PT` | `index.html` (`lang="pt-AO"`) e domínio angolano | Confirmado |
| `ACESSIBILIDADE` | `WCAG 2.2 AA` | Padrão do Prompt Mestre v4 (Seção 1.2 e 23) | Confirmado |
| `TEMAS` | Claro (`#f7f3f3`) e Escuro (`html.dark`) | `src/index.css` e `src/utils/themeService.ts` | Confirmado |
| `DEPENDENCIAS` | Reutilizar existentes | Sem adição de pacotes externos | Confirmado |

---

## 3. Inventário e Mapa de Dependências (Seção 8 & 40.3)

### 3.1 Rotas e Vistas Mapeadas
| ID | Vista / Rota (`currentView` / `currentPage`) | Perfil | Objetivo | Cobertura | Prioridade |
|---|---|---|---|---|---|
| `R-01` | `home` / `PublicLandingPage` | Público / Todos | Apresentação institucional e entrada | `C3` | P1 |
| `R-02` | `login` / `register` (`AuthPage`) | Público | Autenticação, Google OAuth e inscrição com homologação | `C3` | P0 |
| `R-03` | `admin-dashboard`, `admin-escolas`, `admin-aprovacoes` | Admin DME (`dmedoquessua@gmail.com`) | Governação municipal de escolas, diretores, docentes e homologações | `C3` | P0 |
| `R-04` | `diretor-dashboard`, `diretor-pautas`, `diretor-presenca` | Diretor Escolar | Gestão da unidade escolar, mini-pautas, pauta final e livro de ponto | `C3` | P0 |
| `R-05` | `minha-turma`, `professor-presenca`, `estatisticas` | Professor | Diário de classe, lançamento de notas trimestrais e chamada diária | `C2` | P1 |
| `R-06` | `declaracao-efectividade` (`DeclaracaoEfectividadePage`) | Admin / Diretor / Docente | Emissão e base de dados de Declarações de Efectividade oficiais (A4) | `C3` | P0 |
| `R-07` | `sobre`, `termos`, `privacidade`, `seguranca`, `cases` | Público / Todos | Páginas institucionais e jurídicas | `C1` | P2 |

### 3.2 Invariantes Preservadas (Seção 8.4)
1. **Insígnia da República de Angola (`Emblem_of_Angola.svg.webp`)**: Preservada integralmente sem alteração de propriedades no cabeçalho das Mini-Pautas, Pautas Finais (`DirectorPautasPage`, `PautaPdfExportModal`) e Declarações de Efectividade (`DeclaracaoEfectividadePage`).
2. **Barra de Navegação (`Navbar.tsx`)**: Mantida sem os botões diretos eliminados pelo utilizador na barra superior e com o acesso às **Declarações de Efectividade** dentro do menu suspenso **Páginas**.
3. **Homologações e Regras de Negócio**: Contratos de aprovação da conta administradora (`dmedoquessua@gmail.com`), sincronização Firestore/API e cálculos de médias (`calcMT`, `calcMFD`) intocados.

---

## 4. Registro de Problemas, Evidências e Prioridades (Seção 13 & 40.5)

| ID | Problema Observado | Local | Prioridade | Causa Confirmada | Ação Implementada | Evidência | Estado |
|---|---|---|---|---|---|---|---|
| `A11Y-001` | Regra `.text-slate-900 { color: #002133 !important }` aplicava cor escura forçada mesmo em `html.dark`, comprometendo o contraste mínimo WCAG 1.4.3 em superfícies escuras. | `src/index.css` | `P1` | Seletor global com `!important` sem escopo `html:not(.dark)`. | Escopado para `html:not(.dark)` e removido `!important` conflituoso em `html.dark`. | `EV-001` (`E1`/`E0`) | `verificado_no_escopo` |
| `A11Y-002` | Ausência de anel de foco visível padronizado (`:focus-visible`) e `outline: none` em `.gsi-material-button`, além de risco de foco oculto sob o cabeçalho fixo (`WCAG 2.4.7` e `2.4.11`). | `src/index.css` | `P1` | Remoção de outline sem estilo substituto para navegação por teclado. | Adicionado `:focus-visible` global com `outline: 2px solid #f75142`, `scroll-margin-top` compensando `--header-height` e foco no botão Google. | `EV-002` (`E1`/`E0`) | `verificado_no_escopo` |
| `A11Y-003` | Falta de mecanismo para saltar blocos repetidos de navegação por teclado (`WCAG 2.4.1 Bypass Blocks`) e ausência de alvo `#main-content`. | `src/components/Navbar.tsx`, `src/App.tsx` | `P1` | Inexistência de skip-link no topo do DOM e landmark de destino. | Adicionado link `"Saltar para o conteúdo principal"` (`.skip-to-content-link`) apontando para `#main-content`. | `EV-003` (`E1`/`E0`) | `verificado_no_escopo` |
| `UX-001` | Números em tabelas de pautas, notas e métricas sem alinhamento vertical tabular (`tabular-nums`) e títulos longos sujeitos a palavras órfãs. | `src/index.css`, `Navbar.tsx` | `P1` | Ausência de `font-variant-numeric: tabular-nums` em `td, th` e `text-wrap: balance` em headings. | Aplicado `tabular-nums` globalmente em células de tabelas e métricas e `text-wrap: balance` nos cabeçalhos `h1–h6`. | `EV-004` (`E1`/`E0`) | `verificado_no_escopo` |
| `UX-002` | Menus suspensos (`Páginas`, `Notificações`, `Menu Mobile`) e modais informativos não fechavam com a tecla `Escape`; popover de notificações vazio exibia caixa em branco. | `src/components/Navbar.tsx`, `src/App.tsx` | `P1` | Ausência de listener `keydown` para `Escape` e falta de estado vazio (`Empty State`) na lista de notificações. | Implementado fecho via `Escape`, atributos `aria-expanded`/`aria-haspopup`/`role="dialog"` e mensagem de estado vazio em notificações. | `EV-005` (`E1`/`E0`) | `verificado_no_escopo` |
| `UX-003` | Rótulo `"Paginas"` sem acentuação na barra principal e botões de ícone sem `type="button"` ou `aria-label` completo. | `src/components/Navbar.tsx` | `P2` | Microcopy inconsistente com a variante `pt-AO`. | Corrigido para `"Páginas"`, adicionado `type="button"` e `aria-label` descritivo nos controlos. | `EV-006` (`E1`/`E0`) | `verificado_no_escopo` |
| `A11Y-006` | `document.title` permanecia estático ao alternar entre vistas internas e o toast de sistema não anunciava mensagens a leitores de ecrã (`WCAG 2.4.2` e `4.1.3`). | `src/App.tsx` | `P1` | Falta de sincronização de `document.title` com `currentView`/`currentPage` e falta de `role="status" aria-live="polite"` no toast. | Sincronização automática do título da página por vista e adição de região viva `role="status" aria-live="polite"` no toast. | `EV-007` (`E1`/`E0`) | `verificado_no_escopo` |
| `UX-004` | Filtros da página de Pautas sem associação explícita `htmlFor`/`id`, falta de botão de limpeza rápida no campo de busca de aluno e modal de exportação PDF sem `role="dialog"`/`Escape`. | `DirectorPautasPage.tsx`, `PautaPdfExportModal.tsx` | `P2` | Labels visuais sem atributo `htmlFor` e input de pesquisa sem ação de reset imediato. | Associados todos os `<label htmlFor>`, adicionado `aria-pressed` nas turmas, botão `X` para limpar busca e `Escape` + `role="dialog"` no modal de PDF. | `EV-008` (`E1`/`E0`) | `verificado_no_escopo` |

---

## 5. Lotes de Implementação e Rastreabilidade (Seção 14 & 40.4)

| Lote | Arquivos Alterados | Problemas Endereçados | Risco | Estado |
|---|---|---|---|---|
| `LOT-001` | `/src/index.css` | `A11Y-001`, `A11Y-002`, `UX-001` | Baixo | `verificado_no_escopo` |
| `LOT-002` | `/src/components/Navbar.tsx` | `A11Y-003`, `UX-002`, `UX-003` | Baixo | `verificado_no_escopo` |
| `LOT-003` | `/src/App.tsx` | `A11Y-003`, `A11Y-006`, `UX-002` | Baixo | `verificado_no_escopo` |
| `LOT-004` | `/src/components/pages/director/DirectorPautasPage.tsx`, `/src/components/modals/PautaPdfExportModal.tsx` | `UX-004` | Baixo | `verificado_no_escopo` |
| `LOT-005` | `/auditoria-uiux/relatorio.md` | Documentação e continuidade (Seções 39 e 40) | Baixo | `verificado_no_escopo` |

---

## 6. Verificações Executadas (Seção 33 & 40.7)

| ID | Verificação | Procedimento | Ambiente | Resultado | Evidência |
|---|---|---|---|---|---|
| `VER-001` | Typecheck & Lint (`tsc --noEmit`) | `lint_applet` | Node.js / Linux container | `Passou` (0 erros) | `E0` |
| `VER-002` | Build de Produção (`vite build`) | `compile_applet` | Node.js / Linux container | `Passou` | `E0` |
| `VER-003` | Servidor de Desenvolvimento | `restart_dev_server` (Porta 3000) | Ambiente local AI Studio | `Passou` | `E0` |
| `VER-004` | Inspeção Estática de Contratos e Invariantes | Revisão de diffs por lote (`LOT-001` a `LOT-004`) | Repositório local | `Passou` | `E1` |

---

## 7. Matriz de Cobertura (Seção 11 & 40.8)

| Dimensão | Cobertura | Método | Lacunas / Limitações |
|---|---|---|---|
| Rotas e Vistas | `C3` nas vistas críticas; `C1` nas vistas secundárias | Inspeção estática + validação de compilação | Testes em navegador físico externo dependem do utilizador |
| Perfis (`admin`, `diretor`, `professor`, público) | `C2` / `C3` | Análise de fluxos e guardas de acesso (`authGuard.ts`) | Nenhuma regressão de permissão introduzida |
| Teclado e Foco | `C2` | Implementação de `:focus-visible`, skip-link, `Escape` e `aria-*` | Leitor de ecrã físico (NVDA/VoiceOver) não executável no container |
| Temas (Claro / Escuro) | `C2` | Correção de escopo `html:not(.dark)` em `src/index.css` | — |
| Idioma (`pt-AO`) | `C3` | Revisão de microcopy e títulos dinâmicos | — |

---

## 8. Critérios de Aceitação (Seção 34 & 40.9)

| ID | Critério | Resultado | Evidência | Pendência |
|---|---|---|---|---|
| `AC-001` | O utilizador consegue saltar diretamente para `#main-content` via `Tab` e visualizar claramente o foco em todos os elementos interativos. | Atendido | `EV-002`, `EV-003` | Nenhuma |
| `AC-002` | Menus suspensos (`Páginas`, `Notificações`, `Mobile`) e modais fecham com a tecla `Escape` sem perda de estado. | Atendido | `EV-005`, `EV-008` | Nenhuma |
| `AC-003` | Tabelas de pautas e métricas utilizam `tabular-nums` e preservam a insígnia oficial da República de Angola no cabeçalho. | Atendido | `EV-004`, `EV-008` | Nenhuma |
| `AC-004` | `document.title` atualiza dinamicamente conforme a vista ativa e notificações toast possuem `role="status" aria-live="polite"`. | Atendido | `EV-007` | Nenhuma |
| `AC-005` | Build de produção e verificação de tipos (`tsc --noEmit`) concluem sem erros. | Atendido | `VER-001`, `VER-002` | Nenhuma |

---

## 9. Riscos Residuais, Reversão e Continuidade (Seções 35, 40.11–40.13)

### 9.1 Riscos Residuais
| Risco | Impacto | Probabilidade | Próxima Ação | Prioridade |
|---|---|---|---|---|
| Componentes legados extensos com mais de 1.500 linhas (`App.tsx`, `AuthPage.tsx`) | Manutenibilidade a médio prazo | Baixa no curto prazo | Modularizar gradualmente apenas quando houver alteração funcional específica | P3 |

### 9.2 Procedimento de Reversão
Cada lote (`LOT-001` a `LOT-004`) foi aplicado de forma isolada e aditiva, sem alterar esquemas de dados ou contratos de API:
- Para reverter estilos globais (`LOT-001`): restaurar o bloco `@layer base` em `/src/index.css`.
- Para reverter atributos de navegação (`LOT-002`): restaurar `/src/components/Navbar.tsx`.
- Para reverter sincronização de título e `aria-live` (`LOT-003`): restaurar `/src/App.tsx`.
- Para reverter melhorias de formulário nas pautas (`LOT-004`): restaurar `/src/components/pages/director/DirectorPautasPage.tsx` e `/src/components/modals/PautaPdfExportModal.tsx`.
