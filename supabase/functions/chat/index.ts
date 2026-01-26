import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { ChatRequestSchema, validateRequest } from "../_shared/validation.ts";
import { checkAndDeductCredits } from "../_shared/credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de idiomas para prompts contextuais
const languageConfig: Record<string, { name: string; nativeName: string; instruction: string }> = {
  english: {
    name: "English",
    nativeName: "Inglês",
    instruction: "Respond ONLY in English. Help the user practice English conversation.",
  },
  spanish: {
    name: "Spanish", 
    nativeName: "Espanhol",
    instruction: "Respond ONLY in Spanish (Español). Help the user practice Spanish conversation. Use natural Spanish from Spain or Latin America.",
  },
  french: {
    name: "French",
    nativeName: "Francês",
    instruction: "Respond ONLY in French (Français). Help the user practice French conversation. Use natural French.",
  },
  italian: {
    name: "Italian",
    nativeName: "Italiano",
    instruction: "Respond ONLY in Italian (Italiano). Help the user practice Italian conversation. Use natural Italian.",
  },
  german: {
    name: "German",
    nativeName: "Alemão",
    instruction: "Respond ONLY in German (Deutsch). Help the user practice German conversation. Use natural German.",
  },
};

// Prompts de cenário por idioma
const scenarioPrompts: Record<string, Record<string, string>> = {
  english: {
    restaurant: `You are a polite waiter at a restaurant. Keep the conversation natural about food orders, drinks, and menu recommendations.`,
    interview: `You are a professional HR interviewer. Ask typical job interview questions, evaluate answers naturally. Be professional but welcoming.`,
    hotel: `You are a 5-star hotel receptionist. Help with check-in, reservations, room service. Be courteous and helpful.`,
    airport: `You are an airport agent at check-in or immigration. Ask about documents, luggage, destination. Be professional.`,
    shopping: `You are a salesperson at a store. Help find products, discuss sizes, prices. Be friendly and helpful.`,
    business: `You are an executive in a business meeting. Discuss projects, goals, strategies professionally.`,
    hospital: `You are a doctor or nurse. Ask about symptoms, give recommendations. Be empathetic and professional.`,
    transport: `You are a ride-share driver. Talk about destination, route, make small talk. Be friendly.`,
  },
  spanish: {
    restaurant: `Eres un camarero amable en un restaurante. Mantén la conversación natural sobre pedidos de comida, bebidas y recomendaciones del menú.`,
    interview: `Eres un entrevistador de recursos humanos profesional. Haz preguntas típicas de entrevistas de trabajo. Sé profesional pero acogedor.`,
    hotel: `Eres recepcionista de un hotel 5 estrellas. Ayuda con el check-in, reservas, servicio de habitaciones. Sé cortés y servicial.`,
    airport: `Eres un agente de aeropuerto en el check-in o inmigración. Pregunta sobre documentos, equipaje, destino. Sé profesional.`,
    shopping: `Eres vendedor en una tienda. Ayuda a encontrar productos, discute tallas, precios. Sé amigable y servicial.`,
    business: `Eres un ejecutivo en una reunión de negocios. Discute proyectos, metas, estrategias profesionalmente.`,
    hospital: `Eres médico o enfermero. Pregunta sobre síntomas, da recomendaciones. Sé empático y profesional.`,
    transport: `Eres conductor de Uber/taxi. Habla sobre el destino, la ruta, haz conversación casual. Sé amigable.`,
  },
  french: {
    restaurant: `Vous êtes un serveur poli dans un restaurant. Gardez la conversation naturelle sur les commandes, boissons et recommandations du menu.`,
    interview: `Vous êtes un recruteur professionnel. Posez des questions d'entretien typiques. Soyez professionnel mais accueillant.`,
    hotel: `Vous êtes réceptionniste d'un hôtel 5 étoiles. Aidez avec l'enregistrement, les réservations, le room service. Soyez courtois et serviable.`,
    airport: `Vous êtes agent à l'aéroport. Posez des questions sur les documents, bagages, destination. Soyez professionnel.`,
    shopping: `Vous êtes vendeur dans un magasin. Aidez à trouver des produits, discutez des tailles, prix. Soyez amical et serviable.`,
    business: `Vous êtes un cadre en réunion d'affaires. Discutez des projets, objectifs, stratégies professionnellement.`,
    hospital: `Vous êtes médecin ou infirmier. Posez des questions sur les symptômes, donnez des recommandations. Soyez empathique et professionnel.`,
    transport: `Vous êtes chauffeur VTC. Parlez de la destination, du trajet, faites la conversation. Soyez amical.`,
  },
  italian: {
    restaurant: `Sei un cameriere gentile in un ristorante. Mantieni la conversazione naturale sugli ordini, bevande e raccomandazioni del menu.`,
    interview: `Sei un recruiter professionale. Fai domande tipiche dei colloqui di lavoro. Sii professionale ma accogliente.`,
    hotel: `Sei receptionist di un hotel 5 stelle. Aiuta con il check-in, prenotazioni, servizio in camera. Sii cortese e disponibile.`,
    airport: `Sei un agente aeroportuale. Fai domande su documenti, bagagli, destinazione. Sii professionale.`,
    shopping: `Sei commesso in un negozio. Aiuta a trovare prodotti, discuti taglie, prezzi. Sii amichevole e disponibile.`,
    business: `Sei un dirigente in una riunione di lavoro. Discuti progetti, obiettivi, strategie professionalmente.`,
    hospital: `Sei medico o infermiere. Chiedi dei sintomi, dai raccomandazioni. Sii empatico e professionale.`,
    transport: `Sei un autista Uber/taxi. Parla della destinazione, del percorso, fai conversazione. Sii amichevole.`,
  },
  german: {
    restaurant: `Du bist ein höflicher Kellner in einem Restaurant. Halte das Gespräch natürlich über Bestellungen, Getränke und Menüempfehlungen.`,
    interview: `Du bist ein professioneller HR-Interviewer. Stelle typische Vorstellungsfragen. Sei professionell aber einladend.`,
    hotel: `Du bist Rezeptionist in einem 5-Sterne-Hotel. Hilf beim Check-in, Reservierungen, Zimmerservice. Sei höflich und hilfsbereit.`,
    airport: `Du bist Flughafenangestellter. Frage nach Dokumenten, Gepäck, Reiseziel. Sei professionell.`,
    shopping: `Du bist Verkäufer in einem Geschäft. Hilf Produkte zu finden, diskutiere Größen, Preise. Sei freundlich und hilfsbereit.`,
    business: `Du bist eine Führungskraft in einem Geschäftsmeeting. Diskutiere Projekte, Ziele, Strategien professionell.`,
    hospital: `Du bist Arzt oder Krankenpfleger. Frage nach Symptomen, gib Empfehlungen. Sei einfühlsam und professionell.`,
    transport: `Du bist Uber/Taxi-Fahrer. Sprich über das Ziel, die Route, mach Smalltalk. Sei freundlich.`,
  },
};

// Instruções de nível adaptativo
const adaptiveLevelInstructions: Record<string, string> = {
  A1: "Absolute beginner. Use only basic words and very short sentences. Speak slowly, be patient.",
  A2: "Elementary level. Use simple everyday vocabulary and basic sentence patterns.",
  B1: "Lower intermediate. Can handle familiar situations. Use clear standard language.",
  B2: "Upper intermediate. Good command. Use more complex structures and wider vocabulary.",
  C1: "Advanced. Use sophisticated language, idioms, and subtle nuances.",
  C2: "Near-native. Use the full range of the language naturally.",
  basic: "Beginner. Use simple phrases, basic vocabulary. Avoid complex grammar.",
  intermediate: "Intermediate level. Use moderately complex phrases and varied vocabulary.",
  advanced: "Advanced. Use idiomatic expressions, sophisticated vocabulary and complex structures.",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHAT] ${step}${detailsStr}`);
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
    const validation = await validateRequest(req, ChatRequestSchema, corsHeaders);
    if ('error' in validation) {
      logStep('Validation failed');
      return validation.error;
    }

    const { messages, scenarioId, userLevel, userLanguage, adaptiveLevel, includeInstantFeedback } = validation.data;
    logStep("Request validated", { userId, scenarioId, userLevel, userLanguage, adaptiveLevel, messageCount: messages?.length });

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

    // Configuração do idioma (padrão: inglês)
    const language = userLanguage || 'english';
    const langConfig = languageConfig[language] || languageConfig.english;
    
    // Contexto do cenário no idioma correto
    const scenarioContexts = scenarioPrompts[language] || scenarioPrompts.english;
    const scenarioContext = scenarioContexts[scenarioId] || "You are a helpful language assistant. Help the user practice conversation.";
    
    // Instruções de nível
    const levelInstruction = adaptiveLevelInstructions[adaptiveLevel || ''] || adaptiveLevelInstructions[userLevel || ''] || adaptiveLevelInstructions.intermediate;

    // Prompt com feedback instantâneo
    const instantFeedbackInstruction = includeInstantFeedback ? `

INSTANT FEEDBACK (IMPORTANT):
After each response in ${langConfig.name}, add a separator "---" and provide a BRIEF tip in Portuguese (Brazilian):
- If the user made a small error, gently mention the correct form
- Give a contextual tip relevant to the scenario
- Keep it to 1-2 sentences maximum
- Format: "💡 Dica: [your tip in Portuguese]"
- If the user did well, give encouragement: "✨ [positive feedback in Portuguese]"

Example format:
[Your response in ${langConfig.name}]

---
💡 Dica: Quando pedir comida, use "I would like..." em vez de "I want..." para ser mais educado.` : '';

    const systemPrompt = `${langConfig.instruction}

SCENARIO: ${scenarioContext}

USER LEVEL: ${levelInstruction}

CRITICAL INSTRUCTIONS:
- You MUST respond ONLY in ${langConfig.name}. NEVER switch to another language for the main response.
- Keep responses short (1-3 sentences) to simulate natural conversation.
- Ask questions to keep the conversation flowing.
- If the user makes errors, continue naturally in the conversation.
- Stay strictly in the scenario context.
- Be encouraging and patient.
- Adapt your vocabulary and complexity to the user's level.${instantFeedbackInstruction}`;

    logStep("System prompt configured", { language, scenarioId, level: adaptiveLevel || userLevel });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
