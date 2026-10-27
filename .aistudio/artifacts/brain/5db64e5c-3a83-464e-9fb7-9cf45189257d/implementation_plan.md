# Controlo Estrito de Microfone e Câmara Apenas Durante Chamadas Activas

Este plano elimina o pedido automático de permissão de microfone e câmara ao abrir ou navegar na plataforma, garantindo que o navegador só solicite acesso aos dispositivos de áudio e vídeo no momento exacto em que o utilizador iniciar ou entrar numa chamada de voz ou vídeo, desligando completamente o hardware assim que a chamada termina.

## Revisão e Decisões Confirmadas

> [!IMPORTANT]
> As seguintes decisões foram confirmadas para o comportamento de áudio e vídeo na plataforma:

- **Decisão Confirmada 1 — Pedido de Permissão Sob Demanda**: O navegador nunca pedirá acesso ao microfone nem à câmara durante o carregamento inicial da aplicação, login ou navegação normal entre páginas e declarações. O pedido só será accionado quando o utilizador iniciar ou entrar numa chamada de voz ou vídeo.
- **Decisão Confirmada 2 — Activação e Libertação Automática na Chamada**: Ao abrir a janela de uma chamada activa, a permissão de microfone/câmara é solicitada normalmente e, ao fechar ou sair da chamada, todas as faixas de áudio e vídeo são imediatamente encerradas para apagar o indicador de microfone activo no navegador.

---

## 1. Visão Geral e Objectivo

- **Causa do Problema Actual**: O painel de videoconferência permanecia montado em segundo plano mesmo quando fechado (`isOpen = false`), fazendo com que o ciclo de inicialização de multimédia executasse pedidos de acesso ao microfone e à câmara logo ao abrir o site.
- **O Que Esta Melhoria Faz**: Isola o motor de comunicação por voz/vídeo para que só seja instanciado e activado quando uma sala de reunião ou chamada estiver efectivamente aberta (`isOpen = true` e sala válida).
- **Benefício Principal**: Navegação 100% silenciosa e sem avisos intrusivos de permissões de microfone durante o uso administrativo, escolar e de emissão de declarações.

---

## 2. Experiência do Utilizador e Fluxo de Funcionamento

- **Fluxo Fora de Chamadas (Uso Normal do Sistema)**:
  1. O utilizador abre a plataforma, navega pelas páginas, preenche cadastros ou emite declarações.
  2. Nenhum componente de reunião é inicializado em segundo plano e nenhuma chamada às APIs de captura de áudio/vídeo é executada.
  3. O navegador não exibe qualquer janela de permissão de microfone ou câmara.
- **Fluxo Ao Iniciar ou Entrar numa Chamada**:
  1. O utilizador clica explicitamente para iniciar ou entrar numa chamada de voz ou vídeo.
  2. A janela de chamada abre-se e só nesse instante solicita acesso ao microfone (e à câmara, se for chamada de vídeo).
  3. Quando o utilizador encerra ou fecha a chamada, todas as ligações de hardware (`MediaStreamTrack`) e o contexto de áudio são imediatamente desligados e desmontados.

---

## 3. Decisões Técnicas e Trade-Offs

- **Decisão 1: Montagem Condicional da Janela de Chamada e Guarda de Estado Activo**
  - *Abordagem Escolhida*: Renderizar o módulo de chamada apenas quando `activeMeeting.isOpen` for verdadeiro e adicionar uma guarda explícita `enabled` no gestor de WebRTC para que nenhuma captura de dispositivos (`getUserMedia` ou `enumerateDevices`) ocorra sem sala activa.
  - *Porquê*: Garante dupla protecção — o componente nem sequer existe na memória enquanto não houver chamada activa, e ao fechar a chamada o ciclo de limpeza do React liberta imediatamente o microfone no sistema operativo.
  - *Alternativas Consideradas*: Manter o componente oculto com CSS foi descartado porque mantém os efeitos de captura de hardware activos em segundo plano.

---

## 4. Arquitectura Técnica e Fluxo de Estado

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Aplicação Principal (Sigre)                       │
│                                                                         │
│   Estado: activeMeeting.isOpen === false (Padrão em todo o sistema)     │
│   └─► Nenhum módulo de áudio/vídeo montado (0 pedidos de microfone)     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
         Utilizador clica em "Iniciar Chamada de Voz / Vídeo"
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               Módulo de Chamada Activa (isOpen === true)                │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Verifica enabled === true && roomId válido                          │
│  2. Solicita permissão de Microfone / Câmara apenas para a chamada      │
│  3. Ao fechar a chamada (onClose):                                      │
│     ├─► Executa track.stop() em todas as faixas de áudio e vídeo        │
│     ├─► Fecha o AudioContext e desconecta a sinalização da sala         │
│     └─► Desmonta o módulo por completo                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mapeamento de Estado e Garantias de Libertação
- **Estado Inicial (`isOpen: false`)**: O gestor de chamadas permanece inactivo; nenhum pedido de hardware é emitido.
- **Transição para Chamada Activa (`isOpen: true`)**: O motor WebRTC recebe `enabled: true` e inicializa o microfone/câmara de acordo com o tipo de chamada escolhido (apenas áudio ou áudio + vídeo).
- **Transição para Fecho (`isOpen: false`)**: Todas as faixas de `localStream` são interrompidas (`track.stop()`) e o componente é desmontado, desligando imediatamente o ícone de gravação/microfone da aba do navegador.
