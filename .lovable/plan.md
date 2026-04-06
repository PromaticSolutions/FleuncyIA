

## Plano: Exit Intent ao clicar em "voltar" do navegador

### Contexto

Hoje o modal de exit intent dispara quando o mouse sai pelo topo da viewport (desktop only). O usuário quer que ele dispare quando a pessoa clicar no botão **voltar/avançar do navegador** (ou qualquer navegação que saia da página), similar ao comportamento de sites que interceptam a saída.

### Como funciona

O navegador oferece o evento `beforeunload` e a API `popstate` / `beforePopState`. A estratégia mais confiável para SPAs com React Router é:

1. **`beforeunload`** — dispara quando o usuário fecha a aba, digita outra URL, ou clica em link externo. Permite mostrar um diálogo nativo do browser (não customizável), mas **não** permite mostrar nosso modal customizado.

2. **`popstate` (botão voltar/avançar)** — em uma SPA, clicar no botão voltar do navegador dispara navegação interna. Podemos interceptar isso usando `window.history.pushState` para adicionar uma entrada extra no histórico, e ouvir `popstate` para mostrar o modal quando o usuário tentar voltar.

### Estratégia escolhida

Usar a técnica de **history trap**: ao entrar na página, empurramos um estado extra no histórico. Quando o usuário clica "voltar", o `popstate` dispara, mostramos o modal em vez de navegar. Se o usuário fechar o modal ("Agora não"), aí sim deixamos a navegação acontecer.

Manter também o trigger de mouse-leave existente como complemento.

### Mudanças

**`src/hooks/useExitIntent.ts`**
- Adicionar `window.history.pushState(null, '', window.location.href)` ao montar
- Ouvir evento `popstate` — quando disparar, verificar session flag, e se não mostrou ainda, chamar `onExitIntent()` e prevenir a navegação
- Se o modal já foi mostrado na sessão, permitir navegação normal (chamar `history.back()`)
- Manter o listener de `mouseleave` existente como trigger secundário

**`src/components/ExitIntentFeedbackModal.tsx`**
- Ao fechar sem enviar ("Agora não" ou X), chamar `history.back()` para completar a navegação que foi interceptada
- Adicionar prop `onDismissNavigate` opcional para indicar que deve navegar ao fechar

**`src/App.tsx`**
- Passar flag para o modal indicando se foi trigado por navegação (para saber se deve fazer `history.back()` ao fechar)

### Comportamento esperado

1. Usuário está na landing page e clica "voltar" no browser → modal aparece
2. Se envia feedback → salva, mostra sucesso, depois navega para trás
3. Se clica "Agora não" ou X → navega para trás normalmente
4. Aparece apenas 1x por sessão (mesma regra atual)
5. Desktop only (mesma regra atual)
6. Mouse-leave pelo topo continua funcionando como trigger adicional

### Riscos

- iOS Safari e alguns browsers mobile podem não respeitar `pushState` trap — mas o feature é desktop only, então sem impacto
- Não funciona para fechar aba ou digitar URL — isso é limitação do browser (só `beforeunload` nativo funciona nesses casos)

