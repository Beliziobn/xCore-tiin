# Sigre Angola — Engenharia Visual de Alta Precisão (Padrão Masakula v2.0 + Prompt Mestre v4)

Unificação da arquitetura visual por subtração e determinismo operacional (Masakula v2.0) com a governança de acessibilidade, estados e usabilidade (Prompt Mestre v4) em todos os módulos do ecossistema **Sigre Angola**, eliminando ruído cromático, caixas aninhadas e excessos decorativos enquanto preserva 100% das regras de negócio e a solenidade dos documentos oficiais A4.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> As decisões abaixo refletem o alinhamento confirmado na Fase 1 para garantir uma interface limpa, silenciosa e agradável sem perda funcional.

- **Decisão Confirmada 1 — Escopo de Aplicação**: Aplicar rigorosamente a arquitetura de superfície limpa, hierarquia de cartões, tabelas de alta densidade e máquinas de estado determinísticas a todos os módulos do **Sigre Angola** (Painel Central, Administração Municipal DME, Direção Escolar, Corpo Docente, Declarações de Efectividade e Serviços Rápidos).
- **Decisão Confirmada 2 — Direção Cromática (Regra 95 / 3 / 2)**: Adotar base `95%` acromática estrutural (`--canvas: #fafafa`, `--surface: #ffffff`, `--line: #e8e8ea`) combinada com a tinta institucional profunda (`--ink: #002133`) e acento funcional contido (`--accent: #f75142`), reservando cores semânticas exclusivamente para estados reais de exceção, homologação ou urgência.
- **Decisão Confirmada 3 — Subtração Visual com Preservação Documental**: Executar limpeza profunda na interface de operação (máximo 1 KPI escuro `.kpi--featured` por vista, zero *card-in-card*, remoção de pontos luminosos/semáforos em filtros, contenção de botões em grelhas repetitivas), mantendo intocados os modelos oficiais de impressão A4 com a Insígnia da República de Angola.

---

## 1. Overview & Core Concept

- **O Que Faz**: Transforma os painéis administrativos, pedagógicos e de atendimento ao cidadão do Sigre Angola num painel de controlo determinístico, silencioso e de leitura imediata, onde cada pixel comunica estado real do domínio educativo municipal.
- **Público-Alvo e Perfis**:
  - **Administração Municipal (DME Quêssua)**: Gestão da rede escolar, homologação de contas, efetividade docente e despacho de solicitações.
  - **Direção Escolar**: Gestão de turmas, salas, assiduidade docente, mini-pautas e pautas finais.
  - **Corpo Docente e Cidadãos**: Lançamento de notas, frequência de alunos e consulta/solicitação de declarações oficiais.
- **Valor Principal**: Redução drástica da fadiga visual e da latência de decisão (Lei de Hick-Hyman e Rácio Tinta-Dados de Tufte), eliminando fundos multicoloridos concorrentes, ícones redundantes em métricas e ambiguidades de estado.

---

## 2. User Experience & Visual Design

### Fluxos Principais do Utilizador
1. **Orientação Espacial em 3 Segundos**: Ao aceder a qualquer vista (Dashboard, Efectividade, Pedidos Rápidos, Pautas ou Homologações), o olhar resolve instantaneamente:
   - *Fixação 1*: Contexto e título em caixa normal no topo esquerdo.
   - *Fixação 2*: Indicador quantitativo âncora no único cartão escuro `.kpi--featured` da vista.
   - *Fixação 3*: Comando primário único (`.btn--primary`) à direita do cabeçalho.
   - *Fixação 4*: Barra de pesquisa e filtros segmentados neutros sem pontos de semáforo.
   - *Fixação 5*: Tabela ou grelha plana de registos com ações secundárias contidas.
2. **Gestão de Declarações de Efectividade & Serviços Rápidos**:
   - Na aba de cadastro, base de dados e pedidos dos usuários, os cartões de resumo seguem a anatomia limpa de 3 linhas (rótulo, valor tabular, contexto factual), as tabelas alinham valores e contadores com `tabular-nums`, e os botões de ação por linha/cartão usam `.btn--secondary` para não competir com a ação principal da página.
   - Ao visualizar ou imprimir a **Ficha Oficial A4** ou a **Mini-Pauta / Pauta Final**, o documento oficial mantém a Insígnia da República de Angola, tipografia clássica, concordância integral de género e enquadramento estrito numa única página A4.

### Identidade Visual, Tokens e Tipografia
- **Direção Estética**: Engenharia institucional silenciosa — superfícies brancas puras sobre tela neutra clara, delimitações de `1px solid var(--line)`, zero gradientes decorativos em cartões operacionais e zero caixas cinzentas aninhadas (*Anti Card-in-Card*).
- **Sistema de Tokens Semânticos**:
  - Superfícies: `--canvas` (`#fafafa`), `--surface` (`#ffffff`), `--surface-subtle` (`#f4f4f6`), `--line` (`#e8e8ea`), `--line-strong` (`#d1d1d6`), `--track` (`#ececee`).
  - Tinta e Acento Institucional: `--ink` (`#002133`), `--text-secondary` (`#52606d`), `--accent` (`#f75142`), `--text-on-dark` (`#ffffff`), `--text-secondary-on-dark` (`#9fb3c8`).
  - Semânticas de Exceção Verificadas (WCAG AA): `--success-soft` / `--success-text`, `--warning-soft` / `--warning-text`, `--danger-soft` / `--danger-text`.
- **Hierarquia Tipográfica e Disciplina Tabular**:
  - Pares tipográficos: `Plus Jakarta Sans` para estrutura e leitura densa, aliado a `font-variant-numeric: tabular-nums` obrigatório em todas as notas, médias, estatísticas, contadores, datas, números de agente e B.I.
  - Rótulos de KPI e cabeçalhos em caixa normal (*Sentence case*), sem truncamento por reticências (`...`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1 — Unicidade do KPI Escuro (`.kpi--featured`) e Superfícies Brancas Padrão**
  - *Abordagem Escolhida*: Em todas as grelhas de indicadores (Dashboard Inicial, Efectividade, Serviços Rápidos, Escolas, Professores, Alunos e Pautas), todos os cartões de KPI passam a usar superfície `--surface` (`#ffffff`) com borda uniforme `--line`, exceto **um único cartão âncora** em `--ink` (`#002133`) por vista.
  - *Porquê*: Elimina o "carnaval de cores" (cartões amarelos, azuis, verdes e múltiplos blocos escuros na mesma linha) que anulava a hierarquia pré-atentiva.
  - *Alternativas Consideradas*: Manter uma cor de fundo por cada estado nos KPIs foi descartado por violar a Lei 4 do documento Masakula v2.0 e degradar o rácio tinta-dados.
- **Decisão 2 — Contenção de Botões em Grelhas e Achatamento Topológico ($D_{\max} \le 1$)**
  - *Abordagem Escolhida*: Remover sub-caixas cinzentas com borda dentro de cartões de listagem (como nos cartões de pedidos de Serviços Rápidos e estatísticas), apresentando os metadados diretamente sobre a superfície `--surface` separados por espaçamento estrutural e divisória fina `1px solid var(--line)`. Os botões de ação repetidos dentro de cada cartão passam a `.btn--secondary` (contorno neutro), reservando o botão preenchido para a ação global da vista.
  - *Porquê*: Reduz a poluição visual periférica e passa nos testes de escala de cinzentos (`grayscale(100%)`) e desfocagem (`blur(6px)`).
- **Decisão 3 — Preservação Integral de Documentos Oficiais A4 e Contratos de Dados**
  - *Abordagem Escolhida*: A limpeza incide sobre a camada de UI operacional sem alterar esquemas do Firestore/localStorage, rotas de API, autenticação Google/credenciais ou o layout solene das folhas A4 de Declaração de Efectividade e Pautas Escolares.
  - *Porquê*: Cumpre a regra de contratos protegidos do Prompt Mestre v4 (Seção 4.2) e os compromissos institucionais da DME Quêssua.

---

## 4. Technical Architecture & Data Strategy

### Diagrama de Arquitetura e Hierarquia de Componentes

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                 CAMADA DE TOKENS & GOVERNANÇA VISUAL (CSS)                   │
│  --canvas (#fafafa) · --surface (#ffffff) · --ink (#002133) · --line (1px)   │
│  Tipografia Tabular (tabular-nums) · Foco Visível WCAG 2.2 AA · Print A4     │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       SHELL OPERACIONAL SIGRE ANGOLA                         │
│  ┌─────────────────────────┐  ┌───────────────────────────────────────────┐  │
│  │ Barra de Topo Silenciosa│  │ Contentor Principal (#main-content)       │  │
│  │ · Marca Institucional   │  │ · Breadcrumb Contextual & Título H1       │  │
│  │ · Navegação Limpa       │  │ · Grelha de KPIs (Máx. 1 .kpi--featured)  │  │
│  │ · 1 Ação Primária       │  │ · Barra de Filtros Neutros (Zero Pontos)  │  │
│  └─────────────────────────┘  └─────────────────────┬─────────────────────┘  │
└─────────────────────────────────────────────────────┼────────────────────────┘
                                                      │
        ┌─────────────────────────────────────────────┼─────────────────────────────┐
        ▼                                             ▼                             ▼
┌───────────────────────────────┐     ┌───────────────────────────────┐     ┌───────────────────────────────┐
│   PAINÉIS & CADASTROS DME     │     │ SERVIÇOS RÁPIDOS & DESPACHOS  │     │ DOCUMENTOS OFICIAIS IMPRESSOS │
│ · StatCards (3 Linhas Limpas) │     │ · KPIs Neutros + 1 Destaque   │     │ · Declaração Efectividade A4  │
│ · Escolas, Docentes e Alunos  │     │ · Cartões Planos (D_max <= 1) │     │ · Mini-Pautas e Pauta Geral   │
│ · Homologação de Contas       │     │ · Ações de Cartão Secundárias │     │ · Insígnia Oficial Intacta    │
│ · Tabelas de Alta Densidade   │     │ · Máquina de Estados (FSM)    │     │ · Concordância de Género M/F  │
└───────────────────────────────┘     └───────────────────────────────┘     └───────────────────────────────┘
```

### Mapeamento Interativo de Componentes e Estados
- **Sistema Global de Tokens e Primitivas Visuais**:
  - Definição das variáveis canónicas (`--canvas`, `--surface`, `--surface-subtle`, `--ink`, `--line`, `--line-strong`, `--track`, `--text-secondary`, `--success-*`, `--warning-*`, `--danger-*`) e das classes atómicas `.kpi`, `.kpi--featured`, `.btn--primary`, `.btn--secondary`, `.btn--tertiary`, `.filter-chip`, `.badge` e `.data-table`.
- **Grelhas de Indicadores (`StatCards` e Painéis de Módulos)**:
  - Conversão dos cartões de estatísticas para a anatomia de 3 linhas (Rótulo em caixa normal `--text-secondary`, Valor numérico em `--ink` `tabular-nums` sem truncamento, Contexto factual em `--text-xs`), destacando apenas o 1.º indicador principal com `.kpi--featured` (`--ink`) e mantendo os demais em `--surface` branco sem ícones decorativos ou pílulas internas.
- **Módulo de Serviços Rápidos e Despachos (`QuickRequestsManagementView` & `QuickServicesModal`)**:
  - Eliminação dos cartões de KPI multicoloridos (amarelo, azul, verde) e pontos a piscar (`animate-ping`), substituindo-os por 3 KPIs brancos `--surface` e 1 KPI âncora `--ink`.
  - Achatamento dos cartões de pedidos: remoção das sub-caixas cinzentas aninhadas, remoção de ícones decorativos repetidos e conversão dos botões de ação de cada pedido para `.btn--secondary` (contorno neutro), mantendo estados determinísticos claros (`Pendente`, `Em análise`, `Concluído e emitido`).
- **Módulos Administrativos, Direção Escolar e Pautas**:
  - Padronização das barras de filtro (remoção de pontos semáforo e ícones supérfluos dentro de `select`), alinhamento tabular numérico em todas as tabelas de notas e efetividade, e preservação integral dos fluxos de exportação PDF/Excel e impressão A4 em página única.
