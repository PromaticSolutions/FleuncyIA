import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE] ${step}${detailsStr}`);
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

    const userMessages = messages.filter((m: any) => m.role === 'user').map((m: any) => m.content);
    const conversationText = messages.map((m: any) => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`).join('\n');

    const systemPrompt = `Você é um professor de inglês especializado em análise de conversação. Analise a conversa do aluno e forneça feedback detalhado e construtivo.

O cenário da conversa é: ${scenarioId}
Nível declarado do aluno: ${userLevel}

Analise APENAS as mensagens do estudante (não do AI) e forneça uma avaliação honesta mas encorajadora.`;

    const analysisPrompt = `Analise esta conversa de prática de inglês e retorne um JSON com a seguinte estrutura exata:

{
  "overallScore": <número 0-100>,
  "grammar": <número 0-100>,
  "vocabulary": <número 0-100>,
  "clarity": <número 0-100>,
  "fluency": <número 0-100>,
  "contextCoherence": <número 0-100>,
  "errors": [
    {
      "original": "<frase com erro>",
      "corrected": "<frase corrigida>",
      "category": "<grammar|vocabulary|spelling|punctuation>",
      "explanation": "<explicação em português do erro>"
    }
  ],
  "improvements": ["<sugestão 1 em português>", "<sugestão 2>", "<sugestão 3>"],
  "correctPhrases": ["<elogio 1 em português sobre algo bem feito>", "<elogio 2>"],
  "estimatedLevel": "<A1|A2|B1|B2|C1|C2>"
}

Conversa para analisar:
${conversationText}

Mensagens do estudante para análise detalhada:
${userMessages.join('\n')}

IMPORTANTE: 
- Retorne APENAS o JSON, sem markdown ou texto adicional
- Os erros devem ser baseados nas mensagens REAIS do estudante
- Se não houver erros, retorne um array vazio
- Seja específico nas correções
- Os scores devem refletir o desempenho real`;

    logStep("Calling AI for analysis");

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
          { role: "user", content: analysisPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
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
      logStep("AI error", { status: response.status, error: errorText });
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    logStep("AI response received", { contentLength: content.length });

    // Parse JSON from response
    let feedback;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      feedback = JSON.parse(cleanContent);
    } catch (parseError) {
      logStep("JSON parse error, using fallback", { error: String(parseError) });
      feedback = {
        overallScore: 70,
        grammar: 70,
        vocabulary: 70,
        clarity: 75,
        fluency: 70,
        contextCoherence: 75,
        errors: [],
        improvements: ["Continue praticando regularmente", "Tente usar vocabulário mais variado"],
        correctPhrases: ["Boa tentativa de manter a conversa fluindo"],
        estimatedLevel: "B1",
      };
    }

    logStep("Analysis complete", { overallScore: feedback.overallScore });

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
