# Preenchimento Automático por Número do Bilhete de Identidade (B.I.)

Implementação de um motor de pesquisa e preenchimento automático instantâneo a partir do **Número do Bilhete de Identidade (`#field-bi`)**, preenchendo automaticamente os campos **Nome Completo**, **Nome do Pai**, **Nome da Mãe**, **Data de Nascimento** e **Data de Emissão do B.I.** (bem como a naturalidade, província e tratamento correspondentes), complementado por leitura automática de imagem/PDF do B.I. para novos registos.

## Revisão e Decisões Principais

> [!IMPORTANT]
> Como as questões iniciais foram avançadas directamente, o plano adopta as opções recomendadas para máxima facilidade de utilização:
> 1. **Gatilho Duplo (Automático + Botão Consultar)**: Assim que o utilizador digita os 14 caracteres regulamentares do B.I. angolano (`9 dígitos + 2 letras + 3 dígitos`), o sistema procura e preenche os dados automaticamente; adicionalmente, fica disponível um botão **"Consultar B.I."** e uma opção **"Ler Foto / PDF do B.I."** junto ao campo.
> 2. **Fontes Unificadas de Dados**: O sistema pesquisa em tempo real na Base de Dados Unificada do SIGRE (Declarações de Efectividade, Declarações de Serviço, Cadastro de Professores, Directores, Funcionários e Alunos no Firestore e Servidor) e em serviços de consulta do B.I., guardando automaticamente novos B.I.s na base de dados para futuras emissões.

- **Decisão Confirmada 1**: Preenchimento automático imediato de **Nome Completo**, **Nome do Pai**, **Nome da Mãe**, **Data de Nascimento** e **Data de Emissão do B.I.** ao introduzir um B.I. válido de 14 caracteres.
- **Decisão Confirmada 2**: Possibilidade de carregar foto ou PDF do Bilhete de Identidade para extrair automaticamente os mesmos 5 campos quando o funcionário ainda não consta na base de dados local.

---

## 1. Visão Geral e Conceito

- **O Que Faz**: Permite que o operador administrativo ou docente digite o número do Bilhete de Identidade no formulário da Declaração de Efectividade (e na Declaração de Serviço) e veja os campos de identificação pessoal e filiação preenchidos sem necessidade de digitação manual repetitiva.
- **Público-Alvo**: Secretaria escolar, Direcção Municipal de Educação e docentes das escolas de Quêssua.
- **Valor Principal**: Redução drástica do tempo de preenchimento de cada declaração e eliminação de erros de transcrição nos nomes dos pais, datas de nascimento e datas de emissão do B.I.

---

## 2. Experiência do Utilizador e Design Visual

- **Fluxo Passo a Passo**:
  1. **Introdução do Número do B.I.**: No campo `Bilhete de Identidade n.º`, à medida que o utilizador digita ou cola o número (ex.: `002938471ME042`), o sistema apresenta sugestões rápidas caso existam correspondências parciais na base de dados.
  2. **Detecção Automática aos 14 Caracteres**: Ao completar os 14 caracteres do padrão angolano, o indicador de pesquisa verifica instantaneamente a base de dados local, Firestore e API do servidor.
  3. **Preenchimento Instantâneo**: Encontrando o registo, o formulário preenche de imediato:
     - **Nome Completo** (ajustando também automaticamente o Tratamento `Senhor` / `Senhora`)
     - **Nome do Pai**
     - **Nome da Mãe**
     - **Data de Nascimento**
     - **Data de Emissão do B.I.**
     - Campos complementares disponíveis (Naturalidade, Província, Agente, Escola).
  4. **Leitura de B.I. por Foto ou PDF (Para Novos Registos)**: Caso o número do B.I. seja novo e ainda não exista na base de dados, o utilizador pode clicar em **"Extrair do B.I. (Foto/PDF)"** ao lado do campo para ler automaticamente o documento ou preencher uma única vez (ficando memorizado no cache de identidades para sempre).
- **Identidade Visual e Tema**:
  - *Direcção Estética*: Interface administrativa limpa e institucional, alinhada com o painel SIGRE Quêssua.
  - *Paleta de Cores*: Superfícies neutras (`#FFFFFF` e `#F8FAFC`), azul institucional (`#002133`), destaque de acção (`#F75142`) e confirmação semântica verde (`#16A34A`) com mensagem textual clara quando os dados são preenchidos.
  - *Tipografia*: Números de B.I. e datas em fonte monoespaçada tabular (`font-mono tabular-nums`) para leitura rigorosa dos 14 caracteres.

---

## 3. Decisões de Produto e Racional Técnico

- **Decisão 1: Pesquisa Unificada Multi-Colecção + Cache de B.I.**
  - *Abordagem Escolhida*: Cruzar dados de todas as colecções do sistema (`efectividade`, `declaracao_servico`, `staff`, `teachers`, `directors`, `students`) mais um índice dedicado de Bilhetes de Identidade sincronizado com o servidor e Firestore.
  - *Porquê*: Mesmo que um funcionário nunca tenha emitido uma Declaração de Efectividade antes, se já constar na Declaração de Serviço ou no Cadastro de Pessoal/Professores, o seu B.I. preencherá os dados imediatamente.
- **Decisão 2: Extracção Assistida de Documento (OCR do B.I.)**
  - *Abordagem Escolhida*: Disponibilizar no próprio campo do B.I. um botão compacto para carregar imagem/PDF do Bilhete de Identidade que analisa o documento no servidor e preenche Nome Completo, Filiação (Pai e Mãe), Data de Nascimento, Número do B.I. e Data de Emissão.
  - *Porquê*: Garante preenchimento automático mesmo para funcionários recém-chegados que ainda não tenham qualquer registo anterior na base de dados municipal.

---

## 4. Arquitectura Técnica e Estratégia de Dados

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 Formulário de Declaração (#field-bi)                     │
│  ┌──────────────────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Input B.I. (14 caracteres)   │  │ Botão Consultar │  │ Ler Foto/PDF │ │
│  └──────────────┬───────────────┘  └────────┬────────┘  └──────┬───────┘ │
└─────────────────┼───────────────────────────┼──────────────────┼─────────┘
                  │                           │                  │
                  ▼                           ▼                  ▼
┌───────────────────────────────────────────────────────┐ ┌────────────────┐
│        Motor de Consulta de Identidade (B.I.)         │ │ Leitor OCR B.I.│
│  1. Cache Local & Registos de Efectividade/Serviço    │ │ (/api/bi/ocr)  │
│  2. Base de Dados de Professores, Directores e Staff  │ └────────┬───────┘
│  3. Endpoint Servidor (/api/bi/lookup/:bi) & Firestore│          │
└───────────────────────────┬───────────────────────────┘          │
                            └──────────────────┬───────────────────┘
                                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              Actualização Automática do Estado do Formulário             │
│  • Nome Completo + Tratamento (Senhor / Senhora)                         │
│  • Nome do Pai & Nome da Mãe                                             │
│  • Data de Nascimento (YYYY-MM-DD)                                       │
│  • Data de Emissão do B.I. (YYYY-MM-DD)                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Modelo de Dados e Estado**:
  - Cada identidade indexada associa o código normalizado do B.I. (`9 dígitos + 2 letras + 3 dígitos`) aos campos `nome`, `pai`, `mae`, `nascimento`, `biEmissao`, `naturalidade`, `provNat`, `tratamento` e dados profissionais opcionais.
  - Ao guardar qualquer formulário ou consultar um B.I., o registo é sincronizado com o servidor (`/api/bi/lookup`) para que qualquer computador ligado à rede municipal beneficie do preenchimento automático.
- **Mapeamento Interactivo de Estado**:
  - Digitação no `#field-bi` → normaliza para maiúsculas → aos 14 caracteres válidos dispara `lookupBiIdentity(bi)` → se encontrar correspondência, preenche os campos vazios ou actualiza os 5 campos solicitados (`nome`, `pai`, `mae`, `nascimento`, `biEmissao`), limpa eventuais erros de validação desses campos e apresenta uma confirmação visual discreta com o nome do titular encontrado.
