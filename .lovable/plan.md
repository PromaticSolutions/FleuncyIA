

## Plano: Exit Intent apenas no clique do botão Voltar

### O que muda

O usuário quer que o modal de feedback apareça **somente** quando clicar no botão voltar/avançar do navegador — **não** quando o mouse sai pelo topo da tela. Além disso, quer que apareça **toda vez** que clicar em voltar, mesmo após recarregar a página.

### Mudanças

**`src/hooks/useExitIntent.ts`**
- Remover completamente o listener de `mouseleave` (elimina o trigger por mouse)
- Remover a lógica de `sessionStorage` (para que funcione toda vez, não só 1x por sessão)
- Manter apenas o history trap (`pushState` + `popstate`) como único trigger
- Simplificar o hook: ao detectar `popstate`, chamar `onExitIntent()` e re-empurrar o estado no histórico

**`src/components/ExitIntentFeedbackModal.tsx`**
- Sem alterações necessárias — o comportamento de fechar + `history.back()` já funciona

**`src/App.tsx`**
- Sem alterações necessárias

### Comportamento esperado

1. Mouse sai pelo topo → **nada acontece**
2. Usuário clica "voltar" no navegador → modal aparece
3. Fecha o modal → navegação prossegue normalmente
4. Recarrega a página e clica "voltar" novamente → modal aparece de novo
5. Funciona apenas em desktop (mesma regra atual)

