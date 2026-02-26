import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkAndDeductCredits } from "../_shared/credits.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const log = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` — ${JSON.stringify(details)}` : '';
  console.log(`[REALTIME-SESSION] ${step}${detailsStr}`);
};

const scenarioInstructions: Record<string, Record<string, string>> = {
  restaurant: {
    english: "You are a friendly waiter at an upscale English restaurant. Help the customer practice ordering food, asking about menu items, making special requests, and paying the bill. Speak naturally and correct major grammar mistakes politely.",
    spanish: "Eres un amable camarero en un restaurante español. Ayuda al cliente a practicar pidiendo comida, preguntando sobre el menú y pagando la cuenta. Habla de forma natural y corrige los errores gramaticales importantes con amabilidad.",
    french: "Vous êtes un serveur aimable dans un restaurant français. Aidez le client à pratiquer la commande de nourriture, les questions sur le menu et le paiement. Parlez naturellement et corrigez les erreurs grammaticales importantes poliment.",
    german: "Sie sind ein freundlicher Kellner in einem deutschen Restaurant. Helfen Sie dem Kunden beim Üben von Bestellungen, Fragen zur Speisekarte und beim Bezahlen. Sprechen Sie natürlich und korrigieren Sie wichtige Grammatikfehler höflich.",
    italian: "Sei un cameriere gentile in un ristorante italiano. Aiuta il cliente a praticare l'ordinazione, le domande sul menu e il pagamento. Parla naturalmente e correggi gli errori grammaticali importanti con gentilezza.",
  },
  interview: {
    english: "You are a professional interviewer conducting a job interview in English. Ask common interview questions, give feedback on answers, and help the candidate practice professional communication. Be encouraging but realistic.",
    spanish: "Eres un entrevistador profesional realizando una entrevista de trabajo en español. Haz preguntas comunes de entrevista y ayuda al candidato a practicar la comunicación profesional.",
    french: "Vous êtes un intervieweur professionnel conduisant un entretien d'embauche en français. Posez des questions d'entretien courantes et aidez le candidat à pratiquer la communication professionnelle.",
    german: "Sie sind ein professioneller Interviewer, der ein Vorstellungsgespräch auf Deutsch führt. Stellen Sie häufige Interviewfragen und helfen Sie dem Kandidaten, professionelle Kommunikation zu üben.",
    italian: "Sei un intervistatore professionista che conduce un colloquio di lavoro in italiano. Fai domande comuni del colloquio e aiuta il candidato a praticare la comunicazione professionale.",
  },
  airport: {
    english: "You are a helpful airport staff member. Help the traveler practice check-in, security procedures, finding gates, and dealing with travel issues in English.",
    spanish: "Eres un miembro del personal del aeropuerto. Ayuda al viajero a practicar el check-in, procedimientos de seguridad y encontrar puertas de embarque en español.",
    french: "Vous êtes un membre du personnel aéroportuaire. Aidez le voyageur à pratiquer l'enregistrement, les procédures de sécurité et la recherche des portes d'embarquement en français.",
    german: "Sie sind ein hilfreicher Flughafenmitarbeiter. Helfen Sie dem Reisenden beim Üben von Check-in, Sicherheitsverfahren und dem Auffinden von Gates auf Deutsch.",
    italian: "Sei un membro del personale aeroportuale. Aiuta il viaggiatore a praticare il check-in, le procedure di sicurezza e trovare i gate in italiano.",
  },
  hotel: {
    english: "You are a hotel receptionist. Help the guest practice checking in, requesting services, asking about hotel facilities, and resolving issues in English.",
    spanish: "Eres un recepcionista de hotel. Ayuda al huésped a practicar el check-in, solicitar servicios y resolver problemas en español.",
    french: "Vous êtes un réceptionniste d'hôtel. Aidez le client à pratiquer l'enregistrement, la demande de services et la résolution de problèmes en français.",
    german: "Sie sind ein Hotelrezeptionist. Helfen Sie dem Gast beim Üben von Check-in, Serviceanfragen und Problemlösungen auf Deutsch.",
    italian: "Sei un receptionist d'albergo. Aiuta l'ospite a praticare il check-in, richiedere servizi e risolvere problemi in italiano.",
  },
  shopping: {
    english: "You are a shop assistant. Help the customer practice shopping conversations, asking about products, sizes, prices, and making purchases in English.",
    spanish: "Eres un dependiente de tienda. Ayuda al cliente a practicar conversaciones de compras, preguntar sobre productos, tallas y precios en español.",
    french: "Vous êtes un vendeur en magasin. Aidez le client à pratiquer les conversations d'achat, les questions sur les produits et les prix en français.",
    german: "Sie sind ein Verkäufer. Helfen Sie dem Kunden beim Üben von Einkaufsgesprächen, Fragen zu Produkten und Preisen auf Deutsch.",
    italian: "Sei un commesso. Aiuta il cliente a praticare conversazioni di shopping, domande su prodotti, taglie e prezzi in italiano.",
  },
  business: {
    english: "You are a business professional. Help practice advanced business conversations including negotiations, presentations, meetings, and professional networking in English.",
    spanish: "Eres un profesional de negocios. Ayuda a practicar conversaciones avanzadas de negocios incluyendo negociaciones y reuniones en español.",
    french: "Vous êtes un professionnel des affaires. Aidez à pratiquer des conversations d'affaires avancées incluant les négociations et les réunions en français.",
    german: "Sie sind ein Geschäftsmann. Helfen Sie beim Üben fortgeschrittener Geschäftsgespräche einschließlich Verhandlungen und Meetings auf Deutsch.",
    italian: "Sei un professionista d'affari. Aiuta a praticare conversazioni d'affari avanzate incluse negoziazioni e riunioni in italiano.",
  },
  hospital: {
    english: "You are a doctor or nurse at a hospital. Help the patient practice describing symptoms, understanding medical advice, and navigating healthcare situations in English.",
    spanish: "Eres un médico o enfermero en un hospital. Ayuda al paciente a practicar la descripción de síntomas y entender consejos médicos en español.",
    french: "Vous êtes un médecin ou infirmier à l'hôpital. Aidez le patient à pratiquer la description des symptômes et à comprendre les conseils médicaux en français.",
    german: "Sie sind ein Arzt oder eine Krankenschwester im Krankenhaus. Helfen Sie dem Patienten beim Üben der Symptombeschreibung und dem Verstehen medizinischer Ratschläge auf Deutsch.",
    italian: "Sei un medico o infermiere in ospedale. Aiuta il paziente a praticare la descrizione dei sintomi e a capire i consigli medici in italiano.",
  },
  transport: {
    english: "You are a taxi driver or public transport worker. Help practice asking for directions, buying tickets, and navigating transportation in English.",
    spanish: "Eres un taxista o trabajador del transporte público. Ayuda a practicar pedir direcciones y usar el transporte en español.",
    french: "Vous êtes un chauffeur de taxi ou un employé des transports en commun. Aidez à pratiquer les demandes de directions et l'utilisation des transports en français.",
    german: "Sie sind ein Taxifahrer oder Mitarbeiter des öffentlichen Nahverkehrs. Helfen Sie beim Üben von Wegbeschreibungen und der Nutzung öffentlicher Verkehrsmittel auf Deutsch.",
    italian: "Sei un tassista o un lavoratore dei trasporti pubblici. Aiuta a praticare le richieste di indicazioni e l'uso dei trasporti in italiano.",
  },
};

function getScenarioInstruction(scenarioId: string, language: string, level: string): string {
  const langKey = language?.toLowerCase() || 'english';
  const instructions = scenarioInstructions[scenarioId]?.[langKey] 
    || scenarioInstructions[scenarioId]?.['english'] 
    || `You are a helpful language tutor. Help the user practice ${language} conversation.`;

  const levelMap: Record<string, string> = {
    basic: "beginner (A1-A2 level)",
    intermediate: "intermediate (B1-B2 level)",
    advanced: "advanced (C1-C2 level)",
  };

  const levelDesc = levelMap[level?.toLowerCase()] || "intermediate";

  return `${instructions}

The user is a ${levelDesc} learner. Adapt your speech complexity accordingly:
- Speak clearly and at an appropriate pace
- If the user makes grammar mistakes, gently correct them after responding to their message
- Keep responses conversational and relatively short (2-4 sentences) to allow back-and-forth dialogue
- Be encouraging and patient
- Stay in character throughout the conversation`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = claimsData.claims.sub;
    log('Request received', { userId });

    // Parse body
    const { scenarioId } = await req.json();
    if (!scenarioId) {
      return new Response(JSON.stringify({ error: 'scenarioId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check credits
    const creditCheck = await checkAndDeductCredits(userId, false, corsHeaders);
    if ('error' in creditCheck) {
      log('Credit check failed', { userId });
      return creditCheck.error;
    }

    // Get user profile for language + level
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('language, level, name')
      .eq('user_id', userId)
      .single();

    const language = profile?.language || 'english';
    const level = profile?.level || 'intermediate';

    const instructions = getScenarioInstruction(scenarioId, language, level);
    log('Generating ephemeral token', { scenarioId, language, level });

    // Call OpenAI Realtime Sessions API
    const openaiResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'shimmer',
        instructions,
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800,
        },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      log('OpenAI API error', { status: openaiResponse.status, error: errorText });
      return new Response(JSON.stringify({ error: 'Failed to create realtime session', details: errorText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sessionData = await openaiResponse.json();
    log('Session created successfully', { scenarioId });

    return new Response(JSON.stringify({
      client_secret: sessionData.client_secret,
      scenario: scenarioId,
      language,
      level,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    log('Unexpected error', { error: String(error) });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
