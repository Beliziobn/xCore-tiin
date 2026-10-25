# Sistema de Persistência Rígida, Isolamento Escolar e Backup Seguro (SIGRE Angola)

Plano de arquitetura e implementação para garantir a persistência ininterrupta de dados cadastrais (alunos, professores, funcionários da efectividade e turmas), prevenindo esvaziamentos acidentais ou não autorizados, isolando acessos por escola e fornecendo um cofre de backups diários automáticos com restauração em 1 clique exclusivo para o Administrador Máximo (Belízio).

> [!IMPORTANT] Decisões Confirmadas na Fase de Planeamento
> - **Isolamento de Dados**: Particionamento e isolamento estrito por escola (`schoolId` / escola vinculada), sincronizado de forma consistente com o armazenamento em disco e estado central. Administradores escolares gerenciam estritamente a sua instituição, sem sobreposição indesejada.
> - **Cofre de Backups**: Backups automáticos diários gravados em armazenamento persistente em disco (`/data/backups/`) e espelhados em cofre local, com captura de snapshot de segurança antes de qualquer mutação de alto impacto e botão de restauração instantânea ("Restaurar Backup").
> - **Proteção Anti-Esvaziamento**: Esvaziamento em massa ou operações destrutivas restritas de forma inviolável ao Super Admin Belízio (`beliziodos20@gmail.com`), exigindo código mestre de confirmação no backend e frontend.

---

## 1. Visão Geral e Conceito Central

### O Que a Solução Faz
Implementa uma camada de persistência rígida e inviolável para todo o ecossistema SIGRE (alunos, professores, directores e funcionários cadastrados na efectividade). Elimina de raiz o risco de perda ou "esvaziamento sem permissão", criando:
1. **Guarda de Segurança no Servidor e Cliente**: Bloqueio de rotas de limpeza (`DELETE /api/efectividade`, resets de rede) para qualquer utilizador que não seja o Super Admin Belízio com o código de confirmação correcto.
2. **Isolamento Multitenant Escolar**: Cada escola e respectivo administrador acede e manipula apenas os cadastros da sua própria unidade orgânica, evitando poluição cruzada entre admins.
3. **Cofre de Snapshots e Backups Diários**: O sistema gera snapshots automáticos diários e retém versões históricas seguras no servidor (`/data/backups/sigre-backup-*.json`).
4. **Painel de Restauração em 1 Clique**: Um painel intuitivo e visualmente refinado no Painel Admin que permite ao Administrador Máximo visualizar o estado do cofre, gerar um backup manual imediato ou restaurar todo o banco de dados pré-esvaziamento com um clique.

### Público-Alvo e Papéis
- **Super Admin (Belízio - `beliziodos20@gmail.com`)**: Detentor das chaves mestras do sistema; único com permissão de limpar registros em lote, gerenciar backups globais e disparar restaurações de desastre.
- **Directores e Administradores Escolares**: Responsáveis pelo cadastramento diário de alunos, professores e funcionários da sua escola, com a garantia de que os seus cadastros ficam gravados de forma permanente e isolada.

### Valor Principal
Segurança contra falhas operacionais, integridade de dados governamentais angolanos e garantia de recuperação instantânea sem perda de informação cadastral.

---

## 2. Experiência do Utilizador e Design Visual

### Fluxos Principais
1. **Cadastramento Permanente e Isolado**:
   - O utilizador cadastra alunos, professores ou efectividade na respectiva escola.
   - O registo é imediatamente persistido no banco local e gravado no backend (`/api/network/*` e `/api/efectividade`).
   - O sistema valida duplicados por B.I. e Nº de Agente e vincula o identificador da escola, garantindo que o registo fique fixo e acessível apenas à entidade devida.
2. **Tentativa de Esvaziamento / Ação Destrutiva**:
   - Um administrador comum não vê o botão de esvaziamento em massa.
   - Se o Super Admin acionar uma limpeza, abre-se um modal de alta segurança solicitando o código de confirmação mestre (ex: `CONFIRMAR-RESTAURO` ou PIN do Super Admin).
   - O backend valida a identidade e gera um snapshot automático prévio antes de aplicar a alteração, garantindo que mesmo uma limpeza intencional possa ser revertida.
3. **Restauração em 1 Clique no Painel**:
   - No menu Admin, uma seção dedicada ("Cofre de Backups & Integridade") exibe a lista dos últimos backups automáticos diários com contagem de registos, data/hora e status.
   - O botão primário "Criar Backup Agora" gera um ponto instantâneo.
   - O botão de ação "Restaurar Este Ponto" permite restaurar imediatamente todos os dados pré-esvaziamento, recarregando a tabela de efectividade, alunos e professores com confirmação instantânea.

### Identidade Visual e Estética
- **Direção Estética**: Utilitária, sóbria e institucional, de nível governamental e enterprise SaaS, em conformidade com as diretrizes do Ministério da Educação de Angola e design anti-slop.
- **Paleta de Cores**:
  - *Fundo Neutro*: Branco puro (`#FFFFFF`) e ardósia fria suave (`#F8FAFC`).
  - *Superfícies Estruturais*: Bordas ultrafinas de 1px (`border-slate-200`) sem sombras pesadas ou múltiplos cartões aninhados.
  - *Acentos*: Azul institucional do SIGRE (`#1E3A8A`) e verde-esmeralda sóbrio (`#059669`) para pontos de restauro confirmados; carmesim controlado (`#DC2626`) apenas para ações destrutivas sob guarda.
- **Tipografia**: Família sem serifa moderna (`Plus Jakarta Sans` / `DM Sans`), com números tabulares obrigatórios (`tabular-nums font-mono`) para carimbos de data/hora, totais de alunos e códigos de versão.
- **Controles e Metadados**: Metadados limpos com separadores tipográficos (`·`), sem tags do tipo "pílula" decorativas.

---

## 3. Decisões de Produto e Arquitetura

### Decisão 1: Isolamento por Escola com Sincronização em Disco e Memória
- **Abordagem**: Cada cadastro passa a conter obrigatoriamente `schoolId` e `escola`. O endpoint de consulta do servidor e a sincronização local aplicam filtro contextual: administradores escolares recebem apenas registros da sua instituição; o Super Admin possui visão consolidada nacional/provincial.
- **Por quê**: Impede que alterações feitas pelo diretor de uma escola afetem acidentalmente os dados de outra unidade, cumprindo a exigência de "banco de dados não compartilhado entre admins".

### Decisão 2: Motor de Backup Contínuo com Snapshot Pré-Esvaziamento
- **Abordagem**:
  - O backend mantém uma pasta física `/data/backups/`.
  - Rotina automática de backup diário executada pelo servidor, armazenando um arquivo JSON completo com escolas, diretores, professores, alunos, candidaturas e efectividade.
  - Interceptor pré-destrutivo: qualquer operação que modifique ou delete mais de 1 registro gera compulsoriamente um snapshot seguro (`auto-pre-wipe-[timestamp].json`).
- **Por quê**: Caso qualquer operador realize uma ação incorreta, o estado anterior está salvo a 1 clique de distância, eliminando a ansiedade de perda de registros.

### Decisão 3: Guarda de Autorização do Super Admin Belízio (`beliziodos20@gmail.com`)
- **Abordagem**:
  - Header de autenticação administrativo ou payload contendo credenciais de sessão do Super Admin e código de confirmação obrigatório (`adminSecretKey` / `confirmationCode: "SIGRE-BELIZIO-2026"`).
  - Bloqueio completo na rota do servidor: se `email !== 'beliziodos20@gmail.com'` ou se o código de confirmação estiver ausente/inválido, o servidor rejeita a limpeza com status `403 Forbidden`.
- **Por quê**: Garante integridade absoluta, impedindo que scripts, cliques involuntários ou administradores delegados esvaziem a base.

---

## 4. Arquitetura Técnica e Estratégia de Dados

### Diagrama de Arquitetura

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           CLIENTE WEB (REACT SPA)                         │
│                                                                           │
│   ┌──────────────────────────┐             ┌──────────────────────────┐   │
│   │  Telas de Cadastramento  │             │  Painel de Backup Admin  │   │
│   │  (Efectividade, Alunos)  │             │  (Exclusivo Belízio)     │   │
│   └─────────────┬────────────┘             └────────────┬─────────────┘   │
│                 │                                       │                 │
│                 ▼                                       ▼                 │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                   serviço de sincronização e storage              │   │
│   │         (local persistence + escola scope + backup client)        │   │
│   └──────────────────────────────────┬────────────────────────────────┘   │
└──────────────────────────────────────┼────────────────────────────────────┘
                                       │ HTTPS / JSON API
                                       ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         SERVIDOR NODE.JS / EXPRESS                        │
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │       Middleware de Proteção e Autorização do Super Admin         │   │
│   │         (Validação de 'beliziodos20@gmail.com' e Master Code)     │   │
│   └──────────────────────────────────┬────────────────────────────────┘   │
│                                      │                                    │
│   ┌──────────────────────────┐       │     ┌──────────────────────────┐   │
│   │   Rotas de Cadastramento │◄──────┴────►│   Motor de Backups       │   │
│   │   (Filtro por Escola)    │             │   (Snapshots Diários     │   │
│   └─────────────┬────────────┘             │    + 1-Click Restore)    │   │
│                 │                          └────────────┬─────────────┘   │
│                 ▼                                       ▼                 │
│   ┌──────────────────────────┐             ┌──────────────────────────┐   │
│   │  /data/sigre-store.json  │             │  /data/backups/backup-*. │   │
│   │  (Base Ativa Permanente) │             │  (Histórico de Snapshots)│   │
│   └──────────────────────────┘             └──────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

### Endpoints da API de Backups e Segurança
- `GET /api/backup/list`: Lista os pontos de backup diários e automáticos disponíveis (data, tamanho, registros de efectividade, alunos, professores).
- `POST /api/backup/create`: Cria um novo snapshot completo sob demanda (com metadados de quem solicitou).
- `POST /api/backup/restore`: Restaura a base ativa a partir de um backup selecionado (restrito ao Super Admin com confirmação).
- `DELETE /api/efectividade`: Protegido com validação obrigatória de permissão de Super Admin e chave mestre, salvando snapshot automático antes da execução.
- `DELETE /api/efectividade/:id`: Permite a exclusão individual pontual pelo administrador responsável, mantendo a integridade dos demais cadastros.

---

## 5. Plano de Execução por Etapas

1. **Back-end (`server.ts` & rotas de backup)**:
   - Adicionar motor de backups automáticos diários em `/data/backups/`.
   - Implementar endpoints `/api/backup/list`, `/api/backup/create` e `/api/backup/restore`.
   - Blindar `/api/efectividade` e rotas de limpeza com verificação estrita do email de Belízio e código mestre.
   - Reforçar o isolamento por escola nas consultas da base de rede.

2. **Serviço de Armazenamento e Cliente (`src/utils/efectividadeStorage.ts` & `src/services/backupService.ts`)**:
   - Atualizar `efectividadeStorage.ts` para persistência robusta com retenção local de emergência e sincronização de escola.
   - Criar `backupService.ts` para gerenciar a comunicação com os endpoints de backup e restauração instantânea.

3. **Interface do Utilizador (UI)**:
   - Implementar o componente `BackupRestoreModal` ou seção no painel administrativo, permitindo visualizar backups, disparar um novo snapshot e restaurar com um clique.
   - Adicionar modal de confirmação de segurança com código de autorização para ações destrutivas.
   - Garantir que a tabela de Efectividade permita a exclusão individual sem apagar os outros registros e mostre o estado seguro do banco.

4. **Verificação e Testes**:
   - Testar o cadastramento de funcionários e alunos.
   - Testar a criação de backup sob demanda e a rotina diária.
   - Simular tentativa de limpeza e validar o bloqueio para utilizadores comuns.
   - Executar a restauração de 1 clique e validar o retorno de todos os dados intactos.
   - Validar compilação (`compile_applet`) sem erros de lint ou build.
