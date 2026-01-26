import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { SupportChatRequestSchema, validateRequest } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUPPORT] ${step}${detailsStr}`);
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
  if (req.method === 'OPTIONS') {
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
    const validation = await validateRequest(req, SupportChatRequestSchema, corsHeaders);
    if ('error' in validation) {
      logStep('Validation failed');
      return validation.error;
    }

    const { messages, userName, ticketId } = validation.data;
    logStep('Request validated', { userId, ticketId, messageCount: messages?.length });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Sanitize userName for use in system prompt (prevent prompt injection)
    const sanitizedUserName = (userName || 'Usuário').replace(/[<>{}[\]]/g, '').substring(0, 50);
    const sanitizedTicketId = ticketId || 'N/A';

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

Nome do usuário: ${sanitizedUserName}
ID do Ticket: ${sanitizedTicketId}

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
      logStep("AI gateway error", { status: response.status, error: errorText });
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep('Streaming response');

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
