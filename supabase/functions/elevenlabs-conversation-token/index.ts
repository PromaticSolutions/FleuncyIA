import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const scenarioPrompts: Record<string, Record<string, string>> = {
  restaurant: {
    english: "You are a friendly waiter at an upscale English restaurant. Help the customer practice ordering food, asking about menu items, making special requests, and paying the bill. Speak naturally, at a conversational pace. After the user speaks, gently correct major grammar mistakes in a natural way, then continue the conversation.",
    spanish: "Eres un amable camarero en un restaurante español. Habla de forma natural y conversacional. Ayuda al cliente a practicar el idioma. Corrige errores importantes con naturalidad.",
    french: "Vous êtes un serveur aimable dans un restaurant français. Parlez naturellement. Aidez le client à pratiquer le français. Corrigez les erreurs importantes de manière naturelle.",
    german: "Sie sind ein freundlicher Kellner in einem deutschen Restaurant. Sprechen Sie natürlich und in normalem Gesprächstempo. Korrigieren Sie wichtige Fehler auf natürliche Weise.",
    italian: "Sei un cameriere gentile in un ristorante italiano. Parla in modo naturale e conversazionale. Correggi gli errori importanti in modo naturale.",
  },
  interview: {
    english: "You are a professional interviewer conducting a job interview in English. Ask common interview questions, give constructive feedback on answers, and help the candidate practice professional English. Be encouraging and realistic. Keep responses conversational.",
    spanish: "Eres un entrevistador profesional realizando una entrevista de trabajo en español. Haz preguntas comunes, da retroalimentación constructiva y ayuda al candidato a practicar español profesional.",
    french: "Vous êtes un intervieweur professionnel conduisant un entretien en français. Posez des questions courantes et donnez des retours constructifs. Aidez le candidat à pratiquer le français professionnel.",
    german: "Sie sind ein professioneller Interviewer für ein Vorstellungsgespräch auf Deutsch. Stellen Sie häufige Fragen und geben Sie konstruktives Feedback zum deutschen Sprachgebrauch.",
    italian: "Sei un intervistatore professionale per un colloquio di lavoro in italiano. Fai domande comuni e dai feedback costruttivo per aiutare il candidato a praticare l'italiano professionale.",
  },
  airport: {
    english: "You are a helpful airport staff member at check-in or information desk. Help the traveler practice airport vocabulary, check-in procedures, gate information, and handling travel issues. Be natural and conversational.",
    spanish: "Eres un empleado amable del aeropuerto. Ayuda al viajero a practicar el vocabulario del aeropuerto y procedimientos en español.",
    french: "Vous êtes un employé sympathique de l'aéroport. Aidez le voyageur à pratiquer le vocabulaire aéroportuaire en français.",
    german: "Sie sind ein hilfreicher Flughafenmitarbeiter. Helfen Sie dem Reisenden beim Üben des Flughafen-Vokabulars auf Deutsch.",
    italian: "Sei un addetto aeroportuale gentile. Aiuta il viaggiatore a praticare il vocabolario aeroportuale in italiano.",
  },
  hotel: {
    english: "You are a hotel receptionist at a 4-star hotel. Help the guest practice checking in/out, requesting services, asking about hotel facilities, and resolving issues. Speak in a warm, professional, natural tone.",
    spanish: "Eres un recepcionista de hotel. Habla de forma cálida y profesional. Ayuda al huésped a practicar el español en situaciones hoteleras.",
    french: "Vous êtes un réceptionniste d'hôtel chaleureux. Aidez le client à pratiquer le français dans des situations hôtelières.",
    german: "Sie sind ein herzlicher Hotelrezeptionist. Helfen Sie dem Gast beim Üben von Deutsch in Hotelsituationen.",
    italian: "Sei un receptionist d'albergo cordiale. Aiuta l'ospite a praticare l'italiano in situazioni alberghiere.",
  },
  shopping: {
    english: "You are a friendly shop assistant in a clothing or electronics store. Help the customer practice shopping conversations: asking about products, sizes, prices, returns and making purchases in natural English.",
    spanish: "Eres un dependiente de tienda amable. Ayuda al cliente a practicar el español en conversaciones de compras.",
    french: "Vous êtes un vendeur aimable en magasin. Aidez le client à pratiquer le français lors de ses achats.",
    german: "Sie sind ein freundlicher Verkäufer. Helfen Sie dem Kunden beim Üben von Deutsch in Einkaufssituationen.",
    italian: "Sei un commesso gentile. Aiuta il cliente a praticare l'italiano in conversazioni di shopping.",
  },
  business: {
    english: "You are a senior business professional. Help practice advanced business English: negotiations, presentations, meetings, networking, and professional communication. Use realistic business language and scenarios.",
    spanish: "Eres un profesional de negocios senior. Ayuda a practicar el español en contextos profesionales avanzados: negociaciones, reuniones y presentaciones.",
    french: "Vous êtes un professionnel des affaires senior. Aidez à pratiquer le français dans des contextes professionnels avancés.",
    german: "Sie sind ein erfahrener Geschäftsmann. Helfen Sie beim Üben von Geschäftsdeutsch in Verhandlungen und Meetings.",
    italian: "Sei un professionista d'affari senior. Aiuta a praticare l'italiano in contesti professionali avanzati.",
  },
  hospital: {
    english: "You are a doctor or nurse at a hospital. Help the patient practice describing symptoms, understanding medical advice, asking about treatments, and navigating healthcare conversations in English.",
    spanish: "Eres un médico o enfermero. Habla de forma clara y comprensiva. Ayuda al paciente a practicar el español en situaciones médicas.",
    french: "Vous êtes un médecin ou infirmier. Parlez clairement. Aidez le patient à pratiquer le français dans des situations médicales.",
    german: "Sie sind ein Arzt oder Krankenpfleger. Sprechen Sie klar. Helfen Sie dem Patienten beim Üben von Deutsch in medizinischen Situationen.",
    italian: "Sei un medico o infermiere. Parla chiaramente. Aiuta il paziente a praticare l'italiano in situazioni mediche.",
  },
  transport: {
    english: "You are a taxi driver or public transport worker. Help practice asking for directions, buying tickets, navigating public transport, and everyday transportation conversations in natural English.",
    spanish: "Eres un taxista o trabajador del transporte. Habla de forma natural. Ayuda a practicar el español en situaciones de transporte.",
    french: "Vous êtes un chauffeur de taxi ou employé des transports. Parlez naturellement. Aidez à pratiquer le français dans les transports.",
    german: "Sie sind ein Taxifahrer oder Mitarbeiter des ÖPNV. Helfen Sie beim Üben von Deutsch in Verkehrssituationen.",
    italian: "Sei un tassista o un lavoratore dei trasporti. Aiuta a praticare l'italiano in situazioni di trasporto.",
  },
};

const levelContext: Record<string, string> = {
  basic: "The user is a beginner (A1-A2). Speak slowly and clearly. Use simple vocabulary. If they make mistakes, gently correct them in a warm, encouraging way.",
  intermediate: "The user is intermediate (B1-B2). Speak at a natural pace. Occasionally point out grammar or vocabulary improvements naturally during conversation.",
  advanced: "The user is advanced (C1-C2). Speak naturally at full speed. Challenge them with richer vocabulary and natural idioms. Correct only significant errors.",
};

function buildSystemPrompt(scenarioId: string, language: string, level: string): string {
  const lang = language?.toLowerCase() || 'english';
  const lvl = level?.toLowerCase() || 'intermediate';
  const scenarioBase = scenarioPrompts[scenarioId]?.[lang]
    || scenarioPrompts[scenarioId]?.['english']
    || `You are a friendly ${lang} conversation partner. Help the user practice ${lang} in real-life situations.`;

  const levelNote = levelContext[lvl] || levelContext['intermediate'];

  return `${scenarioBase}\n\n${levelNote}\n\nIMPORTANT: Always respond in ${lang} only (unless the user is completely lost and needs a quick clarification). Keep your responses short and conversational (1-3 sentences) to allow natural back-and-forth dialogue. Start the conversation naturally, as if you're already in the scenario.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { scenarioId } = await req.json();
    if (!scenarioId) {
      return new Response(JSON.stringify({ error: 'scenarioId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user profile
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('language, level')
      .eq('user_id', userId)
      .single();

    const language = profile?.language || 'english';
    const level = profile?.level || 'intermediate';
    const agentId = Deno.env.get('ELEVENLABS_AGENT_ID');
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY_CONVAI') || Deno.env.get('ELEVENLABS_API_KEY');

    if (!agentId || !elevenLabsApiKey) {
      return new Response(JSON.stringify({ error: 'ElevenLabs not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = buildSystemPrompt(scenarioId, language, level);

    // Get conversation token with override
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          overrides: {
            agent: {
              prompt: {
                prompt: systemPrompt,
              },
              first_message: getFirstMessage(scenarioId, language),
              language: getLanguageCode(language),
            },
          },
        }),
      }
    );

    if (!response.ok) {
      // Fallback: try without overrides (if not enabled on the agent)
      console.log('Token with overrides failed, trying without overrides...');
      const fallbackResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
        {
          headers: { 'xi-api-key': elevenLabsApiKey },
        }
      );

      if (!fallbackResponse.ok) {
        const errText = await fallbackResponse.text();
        return new Response(JSON.stringify({ error: 'Failed to get conversation token', details: errText }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const fallbackData = await fallbackResponse.json();
      return new Response(JSON.stringify({ token: fallbackData.token, scenario: scenarioId, language, level }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      token: data.token,
      scenario: scenarioId,
      language,
      level,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[elevenlabs-conversation-token] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getFirstMessage(scenarioId: string, language: string): string {
  const lang = language?.toLowerCase() || 'english';
  const messages: Record<string, Record<string, string>> = {
    restaurant: {
      english: "Good evening! Welcome. Do you have a reservation, or would you like a table for tonight?",
      spanish: "¡Buenas noches! Bienvenido. ¿Tiene reserva o desea una mesa para esta noche?",
      french: "Bonsoir ! Bienvenue. Avez-vous une réservation ou souhaitez-vous une table pour ce soir ?",
      german: "Guten Abend! Willkommen. Haben Sie eine Reservierung oder möchten Sie einen Tisch für heute Abend?",
      italian: "Buonasera! Benvenuto. Ha una prenotazione o desidera un tavolo per stasera?",
    },
    interview: {
      english: "Good morning! Please, have a seat. I'm glad you could make it today. Tell me a little bit about yourself to get started.",
      spanish: "¡Buenos días! Por favor, tome asiento. Cuénteme un poco sobre usted para comenzar.",
      french: "Bonjour ! Asseyez-vous, je vous en prie. Parlez-moi un peu de vous pour commencer.",
      german: "Guten Morgen! Bitte nehmen Sie Platz. Erzählen Sie mir zunächst etwas über sich.",
      italian: "Buongiorno! Si accomodi. Mi parli un po' di lei per iniziare.",
    },
    hotel: {
      english: "Good afternoon! Welcome to the Grand Hotel. How can I assist you today?",
      spanish: "¡Buenas tardes! Bienvenido al Grand Hotel. ¿En qué puedo ayudarle?",
      french: "Bonne après-midi ! Bienvenue au Grand Hôtel. Comment puis-je vous aider ?",
      german: "Guten Nachmittag! Willkommen im Grand Hotel. Wie kann ich Ihnen helfen?",
      italian: "Buon pomeriggio! Benvenuto al Grand Hotel. Come posso aiutarla?",
    },
    airport: {
      english: "Good morning! Welcome to the check-in desk. May I see your passport and booking confirmation, please?",
      spanish: "¡Buenos días! Bienvenido al mostrador de facturación. ¿Me puede mostrar su pasaporte y confirmación de reserva?",
      french: "Bonjour ! Bienvenue au comptoir d'enregistrement. Puis-je voir votre passeport et votre confirmation de réservation ?",
      german: "Guten Morgen! Willkommen am Check-in-Schalter. Darf ich Ihren Reisepass und Ihre Buchungsbestätigung sehen?",
      italian: "Buongiorno! Benvenuto al banco check-in. Posso vedere il suo passaporto e la conferma della prenotazione?",
    },
    shopping: {
      english: "Hi there! Welcome in. Are you looking for anything in particular today, or just browsing?",
      spanish: "¡Hola! Bienvenido. ¿Está buscando algo en particular o solo mirando?",
      french: "Bonjour ! Bienvenue. Vous cherchez quelque chose en particulier ou vous regardez juste ?",
      german: "Hallo! Willkommen. Suchen Sie etwas Bestimmtes oder schauen Sie sich nur um?",
      italian: "Ciao! Benvenuto. Sta cercando qualcosa in particolare o sta solo guardando?",
    },
    business: {
      english: "Hello! Great to meet you. I've reviewed your proposal briefly — let's dive right in. What are the key points you'd like to cover today?",
      spanish: "¡Hola! Encantado de conocerle. He revisado brevemente su propuesta. ¿Cuáles son los puntos clave que desea tratar hoy?",
      french: "Bonjour ! Ravi de vous rencontrer. J'ai examiné brièvement votre proposition. Quels sont les points clés que vous souhaitez aborder aujourd'hui ?",
      german: "Hallo! Schön Sie kennenzulernen. Ich habe Ihren Vorschlag kurz gesehen. Was sind die wichtigsten Punkte, die Sie heute besprechen möchten?",
      italian: "Salve! Piacere di conoscerla. Ho esaminato brevemente la sua proposta. Quali sono i punti chiave che desidera trattare oggi?",
    },
    hospital: {
      english: "Good morning. Please have a seat. I'm Doctor Silva. What brings you in today? Tell me what you're experiencing.",
      spanish: "Buenos días. Siéntese, por favor. Soy el doctor Silva. ¿Qué le trae por aquí hoy?",
      french: "Bonjour. Asseyez-vous, je vous prie. Je suis le Docteur Silva. Qu'est-ce qui vous amène aujourd'hui ?",
      german: "Guten Morgen. Bitte nehmen Sie Platz. Ich bin Dr. Silva. Was führt Sie heute zu mir?",
      italian: "Buongiorno. Si accomodi. Sono il dottor Silva. Cosa la porta qui oggi?",
    },
    transport: {
      english: "Hello! Where can I take you today?",
      spanish: "¡Hola! ¿A dónde le llevo hoy?",
      french: "Bonjour ! Où puis-je vous emmener aujourd'hui ?",
      german: "Hallo! Wohin soll ich Sie heute fahren?",
      italian: "Ciao! Dove la porto oggi?",
    },
  };

  return messages[scenarioId]?.[lang] || messages[scenarioId]?.['english'] || "Hello! Let's practice together. How can I help you today?";
}

function getLanguageCode(language: string): string {
  const codes: Record<string, string> = {
    english: 'en',
    spanish: 'es',
    french: 'fr',
    german: 'de',
    italian: 'it',
    portuguese: 'pt',
  };
  return codes[language?.toLowerCase()] || 'en';
}
