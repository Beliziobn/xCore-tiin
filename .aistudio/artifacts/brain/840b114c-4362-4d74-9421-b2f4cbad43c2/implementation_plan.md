# Plano de Implementação: Validação de Vínculo, Integração com Mini-Pautas e Consulta de Vaga Inter-Escolar

## 1. Visão Geral do Problema e Solução
Atualmente, a emissão de documentos nos **Serviços Rápidos** pelo Diretor da Escola permite emitir documentos sem validar automaticamente se o aluno está efetivamente matriculado numa turma da escola, utiliza notas fictícias no Boletim de Notas e permite emitir Guias de Transferência sem consultar previamente a existência de vaga na escola de destino.

Com base nas definições alinhadas, implementaremos três pilares de validação oficial:
1. **Comprovação Automática de Matrícula / Vínculo Escolar**: Todo pedido de *Boletim de Notas*, *Confirmação de Matrícula*, *Declaração de Frequência* ou *Guia de Transferência* será cruzado automaticamente com os alunos matriculados nas turmas da escola. Caso o aluno não conste nos registos da escola, a emissão do documento fica bloqueada e o sistema sugere o indeferimento automático por falta de vínculo.
2. **Boletim de Notas Alimentado pelas Mini-Pautas e Pautas Reais**: O Boletim de Notas deixará de exibir disciplinas e notas estáticas e passará a recolher automaticamente as notas lançadas pelos professores nas Mini-Pautas e Pautas da turma do aluno (MAC, NPP, NPT, MT1, MT2, MT3 e MFD).
3. **Fluxo de Consulta e Reserva de Vaga entre Escolas (Transferência)**:
   - O Encarregado/Aluno solicita a *Guia de Transferência* selecionando a escola de destino pretendida.
   - O Diretor da Escola de Origem comprova o vínculo do aluno e envia digitalmente um **Pedido de Consulta de Vaga** para a Escola de Destino.
   - O Diretor da Escola de Destino recebe a solicitação numa aba própria, verifica a disponibilidade de vagas por turma da mesma classe/turno e **confirma a vaga reservando o lugar numa turma** (ou informa indisponibilidade de vaga).
   - Após a confirmação da vaga pela Escola de Destino, o Diretor da Escola de Origem fica habilitado a emitir a **Guia de Transferência Oficial** com a indicação da turma reservada e notificar o encarregado.

---

## 2. Alterações Técnicas Planeadas

### A. Modelo de Dados e Estados (`src/types.ts`)
- Expandir `QuickRequestStatus` para suportar as etapas do fluxo inter-escolar:
  - `'AGUARDANDO_VAGA_DESTINO'` (Pedido enviado pela escola de origem à escola de destino)
  - `'VAGA_CONFIRMADA'` (Vaga validada e lugar reservado numa turma pela escola de destino)
  - `'SEM_VAGA_DESTINO'` (Escola de destino informou ausência de vagas disponíveis)
- Adicionar metadados em `QuickRequest`:
  - `destinationSchoolId?: string` (ID da escola de destino registada no sistema)
  - `enrolledStudentId?: string`, `enrolledTurmaId?: string`, `enrolledTurmaName?: string` (Dados comprovativos do vínculo na escola de origem)
  - `reservedTurmaId?: string`, `reservedTurmaName?: string` (Turma onde a vaga foi reservada na escola de destino)
  - `vacancyRespondedBy?: string`, `vacancyRespondedAt?: string`, `vacancyNotes?: string` (Auditoria da resposta da escola de destino)
  - `gradesSnapshot?: Array<{ subject: string; mac1?: number; npp1?: number; npt1?: number; mt1?: number; mt2?: number; mt3?: number; mfd?: number; status?: string }>` (Registo consolidado das notas extraídas das Mini-Pautas/Pautas no momento da emissão do Boletim).

### B. Formulário de Solicitação do Aluno/Encarregado (`src/components/QuickRequestModal.tsx`)
- No pedido de **Guia de Transferência**, carregar a lista de escolas cadastradas na plataforma para permitir selecionar a **Escola de Destino** oficial (guardando `destinationSchoolId` e `destinationSchool`), mantendo a opção de indicar o nome caso necessário.
- Exibir no painel de acompanhamento do aluno/encarregado o estado detalhado da transferência (*Aguardando confirmação de vaga na escola destino*, *Vaga confirmada na turma X*, ou *Indeferido por falta de vaga/vínculo*).

### C. Gestão do Diretor: Validação de Vínculo, Pautas e Consulta de Vagas (`src/components/QuickRequestsManagementView.tsx`)
1. **Verificação Automática de Matrícula (Vínculo Escolar)**:
   - Cruzar cada pedido com as turmas (`turmas`) e alunos matriculados da escola (por Nº de Processo/Estudante, Nº do BI ou Nome Completo + Classe).
   - Exibir selo visual claro em cada pedido:
     - **Vínculo Comprovado**: Mostra a Turma, Sala, Turno e Nº de Processo localizados.
     - **Aluno Não Matriculado / Sem Vínculo**: Bloqueia o botão *"Aprovar e Emitir"* e apresenta o botão **"Indeferir Automaticamente (Sem Registo de Matrícula)"** com justificativa pré-preenchida.
2. **Integração Automática com Mini-Pautas e Pautas (Boletim de Notas)**:
   - Para pedidos de `BOLETIM_NOTAS` com vínculo comprovado, buscar todas as Mini-Pautas/Pautas da respetiva turma e extrair as notas reais do aluno em cada disciplina.
   - Apresentar ao Diretor uma pré-visualização das disciplinas e notas apuradas antes da emissão.
3. **Fluxo Inter-Escolar de Transferência (Origem e Destino)**:
   - **Aba "Pedidos da Minha Escola" (Diretor de Origem)**:
     - Em pedidos de `GUIA_TRANSFERENCIA` com vínculo comprovado, exibir o botão **"Solicitar Vaga à Escola Destino"**, mudando o estado para `AGUARDANDO_VAGA_DESTINO`.
     - Quando a escola de destino responder com `VAGA_CONFIRMADA`, liberar o botão **"Emitir Guia de Transferência"** já vinculado à turma reservada. Se responder `SEM_VAGA_DESTINO`, sugerir a comunicação de indeferimento ao encarregado por falta de vaga na escola pretendida.
   - **Nova Aba "Consultas de Vaga Recebidas (Transferências)" (Diretor de Destino)**:
     - Listar pedidos onde a escola atual é a `destinationSchool`.
     - Mostrar a ocupação atual de cada turma compatível com a classe do aluno (ex.: *10ª Classe — Turma A: 28/35 alunos — 7 vagas disponíveis*).
     - Permitir ao Diretor de Destino selecionar a turma e clicar em **"Confirmar Vaga e Reservar Lugar"** (registando a reserva na turma e atualizando o pedido para `VAGA_CONFIRMADA`) ou **"Recusar por Falta de Vaga"** (`SEM_VAGA_DESTINO`).

### D. Emissão Oficial de Documentos (`src/components/OfficialDocumentModal.tsx`)
- **Boletim de Notas**: Substituir a tabela estática pelas disciplinas e notas reais extraídas das Mini-Pautas/Pautas (`gradesSnapshot`), apresentando MAC, NPP, NPT, MT1, MT2, MT3, MFD e Situação por disciplina.
- **Declaração de Matrícula / Frequência**: Incluir os dados reais da turma comprovada no sistema (Turma, Turno, Ano Letivo e código de validação do vínculo).
- **Guia de Transferência**: Incluir os dados oficiais de confirmação de vaga da Escola de Destino (nome da escola de destino, turma reservada e responsável pela confirmação da vaga).

### E. Regras de Segurança (`firestore.rules`)
- Garantir que diretores da escola de destino possam ler e atualizar os campos de resposta de consulta de vaga nos documentos de `quick_requests` endereçados à sua escola.
