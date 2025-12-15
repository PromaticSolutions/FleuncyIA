import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userName, ticketId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um assistente de suporte da Fluency IA, um aplicativo de aprendizado de idiomas.

Sua função:
1. Entender a dúvida ou problema do usuário
2. Fazer perguntas curtas e objetivas para diagnóstico
3. Tentar resolver o problema de forma autônoma
4. Classificar a solicitação (dúvida, erro técnico, acesso, pagamento, outros)

Comportamento:
- Seja cordial, objetivo e profissional
- Use português brasileiro
- Respostas curtas e diretas
- Se não conseguir resolver, sugira escalonamento para atendimento humano
- Sempre pergunte se o problema foi resolvido

Nome do usuário: ${userName || 'Usuário'}
ID do Ticket: ${ticketId || 'N/A'}

Categorias disponíveis:
- duvida: Dúvidas sobre uso do app
- erro_tecnico: Problemas técnicos, bugs, erros
- acesso: Problemas de login, conta
- pagamento: Questões sobre planos, cobranças
- outros: Outras solicitações

Ao identificar a categoria, mencione-a naturalmente na conversa.
Se o problema persistir após 3 tentativas de ajuda, sugira contato via WhatsApp.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Support chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
