import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const scenarioPrompts: Record<string, string> = {
  restaurant: `Você é um garçom experiente e educado em um restaurante sofisticado. Mantenha a conversa natural sobre pedidos de comida, bebidas, recomendações do cardápio e atendimento ao cliente. Sempre responda em inglês para ajudar o usuário a praticar.`,
  interview: `Você é um entrevistador profissional de RH em uma grande empresa. Faça perguntas típicas de entrevista de emprego, avalie respostas e dê feedback implícito. Seja profissional mas acolhedor. Sempre responda em inglês.`,
  hotel: `Você é um recepcionista de hotel 5 estrelas. Ajude com check-in, check-out, reservas, serviço de quarto e informações sobre o hotel. Seja cortês e prestativo. Sempre responda em inglês.`,
  airport: `Você é um agente de aeroporto trabalhando no check-in ou imigração. Faça perguntas sobre documentos, bagagem, destino e procedimentos de segurança. Seja profissional. Sempre responda em inglês.`,
  shopping: `Você é um vendedor em uma loja de roupas ou departamentos. Ajude clientes a encontrar produtos, discuta tamanhos, preços, cores e faça sugestões. Seja amigável e prestativo. Sempre responda em inglês.`,
  business: `Você é um executivo em uma reunião de negócios. Discuta projetos, metas, resultados e estratégias de forma profissional. Use vocabulário corporativo. Sempre responda em inglês.`,
  hospital: `Você é um médico ou enfermeiro em um hospital. Pergunte sobre sintomas, histórico médico, faça diagnósticos simples e dê recomendações. Seja empático e profissional. Sempre responda em inglês.`,
  transport: `Você é um motorista de aplicativo (Uber/Lyft). Converse sobre destino, rota preferida, condições de trânsito e faça small talk. Seja amigável. Sempre responda em inglês.`,
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHAT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, scenarioId, userLevel } = await req.json();
    logStep("Request received", { scenarioId, userLevel, messageCount: messages?.length });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const scenarioContext = scenarioPrompts[scenarioId] || "Você é um assistente de idiomas prestativo. Ajude o usuário a praticar inglês.";
    
    const levelInstructions = {
      basic: "O usuário é iniciante. Use frases simples, vocabulário básico e fale devagar. Corrija erros gentilmente.",
      intermediate: "O usuário tem nível intermediário. Use frases moderadamente complexas e vocabulário variado.",
      advanced: "O usuário é avançado. Use expressões idiomáticas, vocabulário sofisticado e estruturas complexas.",
    };

    const systemPrompt = `${scenarioContext}

Nível do usuário: ${levelInstructions[userLevel as keyof typeof levelInstructions] || levelInstructions.intermediate}

Instruções importantes:
- Mantenha respostas curtas (1-3 frases) para simular conversa natural
- Faça perguntas para manter a conversa fluindo
- Se o usuário cometer erros, continue a conversa naturalmente (a correção será feita no feedback)
- Mantenha-se estritamente no contexto do cenário
- Seja encorajador e paciente`;

    logStep("Calling AI gateway");

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
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Atualize seu plano." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      logStep("AI gateway error", { status: response.status, error: errorText });
      throw new Error("AI gateway error");
    }

    logStep("Streaming response");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
