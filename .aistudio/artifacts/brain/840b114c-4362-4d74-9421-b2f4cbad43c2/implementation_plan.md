# Redirecionamento de Login Google Não Cadastrado para Inscrição

## Objetivo
Garantir que qualquer utilizador que inicie sessão com o Google usando um endereço de e-mail que **ainda não possui conta registada** na plataforma Sigre não seja autenticado automaticamente, mas sim levado imediatamente para a **página de inscrição ("Crie a sua conta")** no **Passo 1** (escolha de perfil e instituição), mantendo o seu nome pré-preenchido e o campo de **e-mail bloqueado (somente leitura)** com o e-mail autenticado pelo Google.

---

## Causa Identificada e Correções de Verificação
1. **Verificação Estrita de Conta Existente por E-mail (`authApprovalStorage.ts` & `AuthPage.tsx`)**:
   - Na função `searchPreRegisteredDirector`, a comparação `normName.includes(s.directorName.toLowerCase())` retornava `true` sempre que uma escola tinha `directorName: ""` (string vazia), fazendo com que qualquer utilizador Google fosse falsamente reconhecido como diretor pré-cadastrado e entrasse direto na plataforma sem ter criado conta.
   - Na função `searchPreRegisteredTeacher`, a correspondência parcial por nome sem filtro de escola também podia gerar falsos positivos durante o login.
   - **Solução**: Corrigir `searchPreRegisteredDirector` e `searchPreRegisteredTeacher` para exigir strings não vazias ao comparar nomes/BI, e no fluxo `completeGoogleLogin` validar estritamente a existência da conta **exclusivamente pelo endereço de e-mail exato** (`findRegisteredAccountByEmail(cleanEmail).exists`, candidatura associada ao e-mail ou documento `users` no Firestore com esse e-mail).

---

## Alterações na Experiência do Utilizador (UX) e Interface

### 1. Redirecionamento Automático para o Passo 1 da Inscrição (`AuthPage.tsx` e `App.tsx`)
- Quando `completeGoogleLogin` detetar que o e-mail do Google não está cadastrado:
  - Muda imediatamente para o modo de inscrição (`mode = 'register'`), sincronizando também o estado da página em `App.tsx` (`currentPage = 'register'`).
  - Reinicia o assistente de registo no **Passo 1** (`regStep = 1`, `registrationSubmitted = false`, `hasChosenRole = false`) para que o utilizador escolha o seu âmbito institucional, função (Passo 1) e escola/repartição (Passo 2).
  - Pré-preenche o **Primeiro Nome**, **Sobrenome**, **E-mail** e guarda a foto/UID do Google para vincular à conta assim que o formulário for submetido no Passo 3.
  - Exibe um aviso claro no topo do formulário informando que o e-mail do Google ainda não possui conta registada no Sigre e que deve concluir os 3 passos para solicitar o seu acesso.

### 2. Campo de E-mail Bloqueado com Conta Google Verificada (`AuthPage.tsx`)
- Quando o registo é iniciado a partir do login Google (`isGoogleLockedEmail = true`):
  - No **Passo 3**, o campo **E-mail institucional** fica **bloqueado (`readOnly`)** com visual de conta verificada pelo Google e um selo indicativo (`Verificado via Google`), impedindo alterações acidentais.
  - Inclui uma opção discreta *"Usar outra conta"* caso o utilizador deseje desvincular o e-mail do Google e digitar outro manualmente.
  - Caso o utilizador troque manualmente de aba ou limpe o registo, o bloqueio é redefinido de forma limpa.
