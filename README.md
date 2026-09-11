# 🎓 Central uCore (xCore-tiin)
### Plataforma Integrada de Gestão Educacional em Angola

[![React 19](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg)](https://expressjs.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Signaling-orange.svg)](https://webrtc.org/)

A **Central uCore** é uma solução completa de gestão escolar desenvolvida especificamente para a realidade e as diretrizes do sistema de ensino em **Angola**. Integrando o padrão oficial do **SIGE (Sistema Integrado de Gestão Escolar)** do Ministério da Educação (MED), a plataforma moderniza e simplifica o fluxo administrativo, pedagógico e de comunicação entre direções escolares, professores, alunos e encarregados de educação.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação e Execução](#-instalação-e-execução)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Módulo SIGE & Motor de Pautas](#-módulo-sige--motor-de-pautas)
- [Salas Virtuais & WebRTC](#-salas-virtuais--webrtc)
- [SEO e Indexação (robots.txt & sitemap.xml)](#-seo-e-indexação)
- [Segurança & Privacidade](#-segurança--privacidade)
- [Licença e Autoria](#-licença-e-autoria)

---

## 🌟 Visão Geral

O sistema responde aos desafios reais das escolas angolanas (Ensino Primário, Iº Ciclo, IIº Ciclo e Magistério/Institutos Técnicos), fornecendo:
- **Automatização de Pautas Trimestrais e Finais**: Cálculo automático de MAC (Média das Avaliações Contínuas), NPP (Nota da Prova do Professor), NPT (Nota da Prova Trimestral) e MT (Média Trimestral).
- **Exportação Fiel ao Modelo SIGE**: Compatível com o *Instrumento Complementar SIGE (2024/2025 e 2026/2027)*, gerando ficheiros Excel `.xlsx` formatados e boletins em PDF prontos para homologação.
- **Diário de Ponto & Gestão Docente**: Controlo de assiduidade de professores e alunos por turma e turno.
- **Gestão de Espaços e Infraestruturas**: Monitorização de salas de aula, capacidade discente, laboratórios e condições físicas.
- **Ambiente de Videoconferência Próprio**: Salas virtuais integradas com partilha de ecrã para Conselhos Pedagógicos e plantão de dúvidas com pais e alunos.

---

## 🚀 Funcionalidades Principais

### 1. Perfis e Painéis Especializados
- **Administração Central / MED**: Visão agregada de múltiplas instituições, indicadores provinciais/municipais (ex.: Luanda, Malanje/Quêssua), aprovação de cadastros e comunicados institucionais.
- **Direção Escolar**: Gestão de professores, turmas, distribuição de disciplinas, salas, estatísticas de aproveitamento e validação de pautas.
- **Corpo Docente**: Diário digital de presenças, lançamento ágil de notas por disciplina/turma e matriz analítica de desempenho.
- **Estudante / Encarregado de Educação**: Consulta de notas, histórico de frequência, emissão de boletins e agendamento de atendimento com a escola.

### 2. Cartografia e Rotas Escolares
- Mapeamento georreferenciado de instituições de ensino com suporte à **Google Maps Platform** (`@vis.gl/react-google-maps`), traçado de rotas e detalhamento de contactos por município.

### 3. Comunicação & Assistência Inteligente
- Sistema de comunicados com alertas por prioridade (urgente, pedagógico, administrativo).
- **Chat em Tempo Real & Suporte**: Canal direto de dúvidas da comunidade escolar.
- **Smart Autofill**: Preenchimento assistido com validação sintática e semântica de dados pedagógicos.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias Utilizadas |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons |
| **Backend Fullstack** | Node.js, Express, WebSocket (`ws`) nativo para sinalização WebRTC, `tsx`, `esbuild` |
| **Base de Dados & Auth** | Firebase Firestore & Firebase Authentication |
| **Documentos & Dados** | ExcelJS, SheetJS (`xlsx`), jsPDF, html-to-image |
| **Mapas & Geovisualização** | Google Maps Platform API (`@vis.gl/react-google-maps`) |
| **Gráficos & Métricas** | Recharts, D3-scale |

---

## 📂 Estrutura do Projeto

```text
├── public/                     # Ficheiros estáticos públicos
│   ├── robots.txt              # Diretrizes de indexação SEO e segurança
│   ├── sitemap.xml             # Mapa de URLs públicas da plataforma
│   ├── Instrumento_Complementar_SIGE_*.xlsx # Modelos oficiais SIGE
│   └── sige_schema.json        # Esquema estrutural do SIGE Angola
├── scripts/                    # Utilitários de processamento e exportação
│   ├── sige_fill_engine.js     # Motor de preenchimento automático das abas SIGE
│   ├── sige_styles.js          # Definições de estilos e cores oficiais para Excel
│   └── sheets/                 # Módulos específicos por folha de cálculo
├── server/                     # Servidores auxiliares
│   └── signaling.ts            # Servidor de sinalização WebRTC para videoconferência
├── src/
│   ├── assets/                 # Imagens e materiais institucionais
│   ├── components/             # Componentes React modularizados
│   │   ├── announcements/      # Painel de comunicados escolares
│   │   ├── boletim/            # Emissão e visualização de boletins de matrícula
│   │   ├── charts/             # Gráficos de assiduidade e aproveitamento
│   │   ├── chat/               # Suporte em tempo real
│   │   ├── meetings/           # Videoconferência WebRTC (Zoom-style)
│   │   ├── modals/             # Modais de cadastro, exportação e pautas
│   │   ├── pages/              # Páginas e dashboards por perfil
│   │   │   ├── admin/          # Gestão geral / MED
│   │   │   ├── director/       # Direção e secretaria escolar
│   │   │   └── legal/          # Termos, Privacidade e Segurança
│   │   └── ui/                 # Componentes visuais base
│   ├── data/                   # Conjuntos de dados iniciais e municípios
│   ├── services/               # Serviços de integração (Sheets, Usuários)
│   ├── utils/                  # Cálculos de médias, exportadores e persistência
│   ├── App.tsx                 # Ponto de entrada do roteador e layout principal
│   ├── firebase.ts             # Configuração e inicialização do Firebase SDK
│   ├── index.css               # Folha de estilo global com Tailwind CSS v4
│   └── types.ts                # Definições de tipos TypeScript unificadas
├── server.ts                   # Servidor Express híbrido (API, WebRTC e Vite)
├── metadata.json               # Configurações de plataforma e permissões
├── package.json                # Dependências e scripts do ecossistema
└── vite.config.ts              # Configuração do Vite e Tailwind v4
```

---

## 💻 Instalação e Execução

### Pré-requisitos
- **Node.js**: Versão 20.x ou superior recomendada.
- **npm**: Versão 10.x ou superior.

### 1. Clonar o Repositório
```bash
git clone https://github.com/Beliziobn/xCore-tiin.git
cd xCore-tiin
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um ficheiro `.env` na raiz do projeto com base no modelo fornecido:
```bash
cp .env.example .env
```
Edite o ficheiro `.env` adicionando as chaves necessárias (ex.: chave da Google Maps API).

### 4. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
O servidor será iniciado na porta **3000** em `http://localhost:3000`, disponibilizando simultaneamente as APIs Express, a sinalização WebRTC e o frontend React.

### 5. Compilação para Produção
```bash
npm run build
```
O comando acima constrói o frontend estático para `dist/` e gera o bundle compilado do servidor em `dist/server.cjs`.

Para iniciar o servidor de produção:
```bash
npm run start
```

---

## 🔑 Variáveis de Ambiente

O ficheiro `.env.example` documenta as variáveis configuráveis do projeto:

```env
# Chave da Google Maps Platform (para mapas de escolas e rotas municipais)
VITE_GOOGLE_MAPS_API_KEY=
```

*Nota: As credenciais públicas de conexão com o Firebase estão centralizadas e guardadas em `firebase-applet-config.json` e `src/firebase.ts`.*

---

## 📊 Módulo SIGE & Motor de Pautas

O sistema conta com um motor completo de pautas e estatísticas escolares adaptado à legislação pedagógica de Angola:

1. **Aproveitamento Escolar**:
   - Cálculo trimestral: $\text{MT} = \frac{\text{MAC} + \text{NPP} + \text{NPT}}{3}$
   - Média Final da Disciplina (MFD) e Classificação Final do Ano (CFA).
   - Indicação automática de Situação (Aprovado, Exame de Recurso, Reprovado por Faltas).
2. **Exportação Fiel ao SIGE**:
   - Geração de ficheiros `.xlsx` com todas as abas oficiais: *Capa, Base de Dados, Alunos Matriculados, Aproveitamento Escolar, Infraestruturas, Pessoal Docente e Pessoal Não-Docente*.
   - Estilização condicional (notas vermelhas abaixo de 10 valores, cabeçalhos oficiais com insígnia da República de Angola).

---

## 📹 Salas Virtuais & WebRTC

A plataforma possui um serviço nativo de reuniões em tempo real (`server/signaling.ts` e `src/components/meetings/ZoomMeetingModal.tsx`):
- **Sinalização WebSocket Integrada**: Estabelece chamadas ponto-a-ponto via WebRTC (SDP Offer/Answer e ICE Candidates).
- **Sem Dependência Externa de Terceiros**: Transmissão segura e direta de áudio, vídeo e partilha de ecrã para conselhos de turma, reuniões pedagógicas e atendimento aos encarregados.

---

## 🔍 SEO e Indexação

A plataforma está otimizada para motores de busca com separação estrita entre conteúdo público e áreas restritas de proteção de dados:

- **`public/robots.txt`**:
  - Permite a indexação de páginas públicas institucionais (Sobre, Casos de Sucesso, FAQ, Termos, Políticas, Mapas de Escolas).
  - Bloqueia indexação de rotas sensíveis (`/admin`, `/diretor`, `/professor`, `/aluno`, `/api/` e parâmetros de dados privados).
  - Protege ficheiros brutos de dados escolares (`.xlsx`, `.json`, backups).
  - Define limites de taxa de rastreio e aponta para os ficheiros `sitemap.xml`.
- **`public/sitemap.xml`**:
  - Mapeamento XML estruturado com frequências de atualização e prioridades de rastreio.
- **Dados Estruturados JSON-LD**:
  - Incluídos em `index.html` sob os esquemas `EducationalOrganization` e `WebSite`.

---

## 🔒 Segurança, Arquitetura SSD & Conformidade RLS

A plataforma implementa práticas avançadas de **SSD (Secure Software Development)** e regras de segurança granulares:

### 1. RLS & Least-Privilege (Firestore Rules)
- **Default Deny**: Nenhuma coleção possui leitura ou escrita pública irrestrita.
- **Auto-Registo Sem Escalação de Privilégios**: Utilizadores novos não podem auto-atribuir papéis de `admin` ou `diretor`.
- **Integridade de Notas & Pautas (0 a 20)**: Validação a nível de regras das notas do sistema pedagógico angolano.
- **Trilha de Auditoria Imutável**: A coleção `/audit_logs` é append-only (proibida alteração ou deleção mesmo por administradores).

### 2. Limits of Request (Rate Limiting)
- **Proteção contra DoS e Brute-force**: Janela deslizante (*sliding window*) de taxa de requisições no servidor Express (`server.ts`):
  - **Rotas Padrão**: Teto de 120 requisições por minuto por IP com cabeçalhos `X-RateLimit-Limit` e `X-RateLimit-Remaining`.
  - **Rotas Críticas / Sensíveis**: Teto de 30 requisições por minuto por IP para rotas de autenticação, aprovações e exportação.
  - **HTTP 429 Too Many Requests**: Com cabeçalho `Retry-After` para salvaguarda da infraestrutura.

### 3. Integridade Referencial & Foreign Keys
- Como o Firestore é NoSQL orientado a documentos, a plataforma implementa um serviço de integridade referencial (`src/services/referentialIntegrity.ts`):
  - Validação de chaves estrangeiras de Estudante (`schoolId`, `turmaId`, `gradeClassId`).
  - Prevenção de registos órfãos de professores e pautas.
  - Bloqueio de atribuição de notas a alunos não matriculados.

### 4. Validação & Constraints nos Formulários
- Utilitário centralizado em `src/utils/formConstraints.ts`:
  - **Bilhete de Identidade (BI) de Angola**: 14 caracteres alfanuméricos com validação de máscara oficial e código de província.
  - **Telefone**: Validação de números angolanos (+244 9XX XXX XXX).
  - **Escala de Notas**: Restrição estrita no intervalo [0.00, 20.00].
  - **Sanitização SSD**: Limpeza proativa de tags e atributos perigosos contra XSS e injeções.

### 5. Índices nas Colunas de Busca
- **`src/utils/searchIndexer.ts`**: Motor de tokenização com normalização NFD e prefixos para buscas O(1) / O(log N).
- **`firestore.indexes.json`**: Definição de índices compostos em colunas frequentemente consultadas (`users`, `students`, `teachers`, `audit_logs`).

### 6. Logs de Auditoria & Trilha de Conformidade
- Serviço `AuditLogger` (`src/services/auditLogger.ts`):
  - Registo em lote e em tempo real com timestamp, autor, papel, tipo de ação e alvo.
  - Checksum determinístico SHA-256 para deteção de adulteração de integridade.
  - Modal administrativo `AdminAuditLogsModal.tsx` com filtros, busca textual e exportação de logs.

---

## 🧪 TDD (Test Driven Development)

A suite de testes unitários automatizados foi concebida seguindo o padrão TDD:

```bash
# Executar a suite de testes TDD
npm run test
```

- **`src/tests/formConstraints.test.ts`**: Testes de constraints de BI angolano, telefone, notas de 0 a 20, e sanitização contra XSS.
- **`src/tests/referentialIntegrity.test.ts`**: Testes de validação de chaves estrangeiras (FK), orfandade e atribuição de pautas.
- **`src/tests/securityAndAudit.test.ts`**: Testes do motor de busca tokenizada, cálculo de rate limits e integridade de auditoria.

---

## 📄 Licença e Autoria

Desenvolvido para modernização e gestão do ecossistema educacional em Angola.  
Todos os direitos reservados à **Central uCore** / Equipa de Desenvolvimento.
