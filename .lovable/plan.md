
## Análise Completa

**O que o usuário quer:**
1. Salvar a `OPENAI_API_KEY` com segurança nos secrets
2. Implementar chamada de voz (Voice Call) usando OpenAI Realtime API
3. Adicionar módulo sutil na dashboard (Home) sobre a feature de chamada
4. Tudo funcionando perfeitamente, integrado ao projeto existente

**Estado atual do projeto:**
- `supabase/config.toml` — precisa adicionar `[functions.realtime-session]` e `[functions.text-to-speech]` (este não está listado ainda)
- `src/App.tsx` — precisa adicionar rota `/voice-call/:scenarioId`
- `src/pages/Home.tsx` — adicionar card sutil de "Chamada de Voz"
- `src/data/scenarios.ts` — sem mudanças necessárias, os cenários já existem
- Backend: criar `supabase/functions/realtime-session/index.ts`
- Frontend: criar `src/hooks/useRealtimeCall.ts` e `src/pages/VoiceCall.tsx`

**Fluxo completo:**
```
User clica "Praticar por Voz" no card do cenário
  → navega para /voice-call/:scenarioId
  → VoiceCall page pede ephemeral token (realtime-session edge function)
  → edge function autentica JWT, verifica créditos, chama OpenAI /v1/realtime/sessions
  → retorna client_secret ao frontend
  → frontend cria RTCPeerConnection via WebRTC
  → WebSocket DataChannel recebe transcrições em tempo real
  → ao encerrar: salva transcrição, navega para /feedback
```

---

## Plano de Implementação

### 1. Salvar OPENAI_API_KEY nos secrets
- Usar a ferramenta `add_secret` para solicitar a chave ao usuário (a chave foi compartilhada no chat, mas deve ser armazenada como secret, não no código)

### 2. Edge Function: `supabase/functions/realtime-session/index.ts`
- Autenticar JWT (mesmo padrão dos outros edge functions)
- Verificar créditos via `checkAndDeductCredits` — cobrar 1 crédito ao iniciar a sessão
- Montar `instructions` (system prompt) com cenário + idioma + nível do usuário (igual ao chat/index.ts mas adaptado para voz)
- Chamar `POST https://api.openai.com/v1/realtime/sessions` com:
  - `model: "gpt-4o-realtime-preview-2024-12-17"`
  - `voice: "shimmer"` (voz clara, neutra)
  - `input_audio_transcription: { model: "whisper-1" }` para capturar o que o usuário fala
  - `instructions`: system prompt do cenário no idioma correto
- Retornar `{ client_secret, scenario, language }`

### 3. Atualizar `supabase/config.toml`
- Adicionar `[functions.realtime-session]` com `verify_jwt = false`
- Adicionar `[functions.text-to-speech]` com `verify_jwt = false` (está faltando)

### 4. Hook: `src/hooks/useRealtimeCall.ts`
- Estado: `status: 'idle' | 'connecting' | 'active' | 'ended'`
- `startCall(scenarioId)`:
  1. Fetch `realtime-session` com JWT do usuário
  2. `new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })`
  3. `getUserMedia({ audio: true })` → `addTrack`
  4. `ontrack` → conectar stream recebido ao `<audio autoplay>`
  5. Criar DataChannel `"oai-events"` para receber eventos de transcrição
  6. SDP offer → `fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", { method: "POST", body: offer.sdp, headers: { Authorization: "Bearer {client_secret}", "Content-Type": "application/sdp" } })`
  7. Setar `remoteDescription` com answer SDP
- `endCall()`: fechar `RTCPeerConnection`, parar tracks, setar status `'ended'`
- Capturar transcrições do DataChannel (`conversation.item.input_audio_transcription.completed` e `response.audio_transcript.done`)
- Expor: `status`, `startCall`, `endCall`, `transcript`, `duration`

### 5. Página: `src/pages/VoiceCall.tsx`
- Layout: tela escura estilo chamada, fullscreen mobile-first
- UI:
  - Ícone/emoji do cenário centralizado com pulse animation quando ativo
  - Nome do cenário + idioma + nível
  - Timer de duração (contador em segundos)
  - Status em texto: "Conectando...", "Em chamada", "IA falando...", "Ouvindo..."
  - Indicador visual de áudio (ondas animadas)
  - Botão vermelho redondo "Encerrar" com ícone de telefone
- `<audio ref={audioRef} autoPlay>` hidden para reproduzir a IA
- Ao `status === 'ended'`: salvar conversa no banco + navegar para `/feedback`
- Tratar erros de microfone e conexão com mensagens amigáveis

### 6. Atualizar `src/App.tsx`
- Adicionar `import VoiceCall from './pages/VoiceCall'`
- Adicionar rota protegida: `<Route path="/voice-call/:scenarioId" element={<ProtectedRoute><VoiceCall /></ProtectedRoute>} />`
- Adicionar `/voice-call/` na lista `noHelpButtonRoutes` para esconder o botão de ajuda

### 7. Atualizar `src/pages/Home.tsx` — Card sutil na dashboard
- Adicionar um card sutil na seção de Quick Actions (ao lado dos cards de Conquistas e Ranking existentes)
- Design: gradiente roxo/violeta suave, ícone de telefone, texto direto
- Texto: "Chamada de Voz" / "Pratique como em uma conversa real"
- Ao clicar: abrir um modal simples para selecionar o cenário (reutiliza os cenários existentes)
- Navegação: `navigate('/voice-call/${scenario.id}')`

### 8. Componente modal de seleção de cenário para chamada: `src/components/VoiceCallScenarioModal.tsx`
- Dialog simples listando os cenários disponíveis para o usuário (mesmos do home)
- Cada item: emoji + nome + ao clicar navega para `/voice-call/:id`

---

## Arquivos que serão criados/editados

| Arquivo | Ação |
|---|---|
| `supabase/functions/realtime-session/index.ts` | Criar |
| `supabase/config.toml` | Editar (adicionar 2 entradas) |
| `src/hooks/useRealtimeCall.ts` | Criar |
| `src/pages/VoiceCall.tsx` | Criar |
| `src/components/VoiceCallScenarioModal.tsx` | Criar |
| `src/App.tsx` | Editar (rota + exclusão do HelpButton) |
| `src/pages/Home.tsx` | Editar (card sutil + modal) |

**Sem mudanças em:** banco de dados, TTS existente, Chat existente, sistema de créditos, locales.

---

## Observações técnicas

- A `OPENAI_API_KEY` foi compartilhada no chat — será armazenada como secret, **nunca** no código
- A chamada de voz consome créditos: 1 crédito por sessão iniciada (ao gerar o ephemeral token)
- iOS Safari: `getUserMedia` e `RTCPeerConnection` funcionam desde iOS 14.3+, mas `AudioContext` precisa ser iniciado por gesto — o botão "Iniciar Chamada" garante isso
- O modelo `gpt-4o-realtime-preview-2024-12-17` usa WebRTC nativo (não WebSocket), sem dependências extras de SDK
