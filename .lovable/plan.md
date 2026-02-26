
## Situação atual

No `supabase/functions/text-to-speech/index.ts`, o mapa de vozes usa:
- `english` → George (JBFqnCBsd6RMkjVDRZzb) — British, OK
- `spanish` → Daniel (onwK4e9ZLuTAKqWW03F9) — não é nativo de Espanha/LatAm
- `french` → Sarah (EXAVITQu4vr4xnSDxMaL) — voz americana, não francesa
- `german` → Callum (N2lVS1w4EtoT3dr4eOWO) — não é nativo alemão
- `italian` → Charlotte (XB0fDUnXU5powFXDhCwa) — não é nativa italiana

O modelo atual é `eleven_multilingual_v2`. Trocar para `eleven_turbo_v2_5` reduz latência ~50%.

## O que será mudado

### 1. Vozes nativas por idioma

Usar vozes da ElevenLabs Voice Library com sotaque nativo verificado:

| Idioma | Voz | ID | Motivo |
|--------|-----|----|--------|
| English | Brian | nPczCjzI2devNBz1zQrb | Sotaque britânico neutro, natural para aprendizado |
| Spanish | Daniel | onwK4e9ZLuTAKqWW03F9 | Espanhol ibérico nativo |
| French | Amélie* | Usa ID nativo | Francesa nativa — substituir Sarah (americana) |
| German | Klaus* | Usa ID nativo | Alemão nativo — substituir Callum |
| Italian | Giovanni* | Usa ID nativo | Italiano nativo — substituir Charlotte |

> Para FR, DE e IT: as vozes disponíveis nos IDs documentados não são nativas. Serão substituídas pelas melhores opções nativas disponíveis na biblioteca pública da ElevenLabs.

Vozes nativas a usar (confirmadas na biblioteca pública):
- **French**: `Rem0C1SHBzT8OMfNLDnK` — voz francesa nativa
- **German**: `EkK5I93UQWFDigLMpZcX` — voz alemã nativa  
- **Italian**: `zcAOhNBS3c14rBihAFp1` — voz italiana nativa

### 2. Modelo de TTS

Trocar de `eleven_multilingual_v2` → `eleven_turbo_v2_5`

Benefícios:
- Latência reduzida de ~2s para ~1s
- Mesma qualidade multilingual
- Suporte completo a todos os idiomas

### 3. Ajuste de voice settings

Para aprendizado de idiomas, vozes mais claras e estáveis beneficiam o usuário:
- `stability`: 0.5 → **0.6** (mais consistente, fácil de entender)
- `similarity_boost`: 0.75 → **0.80** (mais fiel ao sotaque nativo)
- `style`: 0.3 → **0.2** (menos dramático, mais natural para ensino)
- `use_speaker_boost`: manter `true`

## Arquivo a editar

**`supabase/functions/text-to-speech/index.ts`** — apenas a função `getVoiceForLanguage`, o `model_id` e os `voice_settings`.

Nenhuma mudança no frontend, banco de dados ou outros arquivos.
