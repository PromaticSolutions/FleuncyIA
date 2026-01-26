import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { AnalyzeRequestSchema, validateRequest } from "../_shared/validation.ts";
import { checkAndDeductCredits } from "../_shared/credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const languageNames: Record<string, { name: string; nativeName: string }> = {
  english: { name: "English", nativeName: "inglês" },
  spanish: { name: "Spanish", nativeName: "espanhol" },
  french: { name: "French", nativeName: "francês" },
  italian: { name: "Italian", nativeName: "italiano" },
  german: { name: "German", nativeName: "alemão" },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE] ${step}${detailsStr}`);
};

// Authentication helper using getClaims
async function authenticateUser(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized - Missing token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);

  if (error || !data?.claims) {
    logStep('Auth failed', { error: error?.message });
    return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = data.claims.sub as string;
  logStep('User authenticated', { userId });
  return { userId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authResult = await authenticateUser(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { userId } = authResult;

    // Validate request body
    const validation = await validateRequest(req, AnalyzeRequestSchema, corsHeaders);
    if ('error' in validation) {
      logStep('Validation failed');
      return validation.error;
    }

    const { messages, scenarioId, userLevel, userLanguage } = validation.data;
    logStep("Request validated", { userId, scenarioId, userLevel, userLanguage, messageCount: messages?.length });

    // Server-side credit check and deduction
    const creditResult = await checkAndDeductCredits(userId, false, corsHeaders);
    if ('error' in creditResult) {
      return creditResult.error;
    }
    logStep("Credits validated", { isPaidPlan: creditResult.result.isPaidPlan, remaining: creditResult.result.remainingCredits });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const language = userLanguage || 'english';
    const langInfo = languageNames[language] || languageNames.english;

    const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content);
    const conversationText = messages.map((m) => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`).join('\n');

    const systemPrompt = `Você é um professor de ${langInfo.nativeName} especializado em análise de conversação. Analise a conversa do aluno praticando ${langInfo.nativeName} e forneça feedback detalhado e construtivo.

O cenário da conversa é: ${scenarioId}
Nível declarado do aluno: ${userLevel || 'intermediate'}
Idioma praticado: ${langInfo.name} (${langInfo.nativeName})

Analise APENAS as mensagens do estudante (não do AI) e forneça uma avaliação honesta mas encorajadora. Lembre-se que o aluno está praticando ${langInfo.nativeName}, então analise os erros nesse idioma.`;

    const analysisPrompt = `Analise esta conversa de prática de ${langInfo.nativeName} e retorne um JSON com a seguinte estrutura exata:

{
  "overallScore": <número 0-100>,
  "grammar": <número 0-100>,
  "vocabulary": <número 0-100>,
  "clarity": <número 0-100>,
  "fluency": <número 0-100>,
  "contextCoherence": <número 0-100>,
  "errors": [
    {
      "original": "<frase com erro em ${langInfo.nativeName}>",
      "corrected": "<frase corrigida em ${langInfo.nativeName}>",
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
- Os erros devem ser baseados nas mensagens REAIS do estudante em ${langInfo.nativeName}
- Se não houver erros, retorne um array vazio
- Seja específico nas correções
- Os scores devem refletir o desempenho real no idioma ${langInfo.nativeName}`;

    logStep("Calling AI for analysis", { language });

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

    logStep("Analysis complete", { overallScore: feedback.overallScore, language });

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
