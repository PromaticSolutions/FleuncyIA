import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { TTSRequestSchema, validateRequest } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TTS] ${step}${detailsStr}`);
};

// Map language to appropriate ElevenLabs voice (native speakers)
function getVoiceForLanguage(language: string): string {
  const voiceMap: Record<string, string> = {
    'english': 'nPczCjzI2devNBz1zQrb', // Brian - British neutral, clear for learning
    'spanish': 'onwK4e9ZLuTAKqWW03F9', // Daniel - Iberian Spanish native
    'french':  'Rem0C1SHBzT8OMfNLDnK', // French native voice
    'german':  'EkK5I93UQWFDigLMpZcX', // German native voice
    'italian': 'zcAOhNBS3c14rBihAFp1', // Italian native voice
  };
  return voiceMap[language?.toLowerCase()] || 'nPczCjzI2devNBz1zQrb';
}

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
    // Validate request body
    const validation = await validateRequest(req, TTSRequestSchema, corsHeaders);
    if ('error' in validation) {
      logStep('Validation failed');
      return validation.error;
    }

    const { text, language, isDemoMode } = validation.data;

    let userId = 'demo-user';
    if (isDemoMode) {
      logStep('Demo mode - skipping auth');
    } else {
      const authResult = await authenticateUser(req);
      if (authResult instanceof Response) {
        return authResult;
      }
      userId = authResult.userId;
    }

    logStep("Request validated", { userId, textLength: text.length, language });

    // NOTE: Credits are NOT deducted here - TTS is a response feature.
    // Credits are only deducted when the user sends a message (text or audio).

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não configurada");
    }

    // Ensure language has a default
    const effectiveLanguage = language || 'english';
    
    logStep('Generating speech with ElevenLabs', { userId, textLength: text.length, language: effectiveLanguage });

    const voiceId = getVoiceForLanguage(effectiveLanguage);
    logStep('Voice selected', { voiceId });

    // Call ElevenLabs TTS API directly
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.80,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep('ElevenLabs error', { status: response.status, error: errorText });
      throw new Error(`TTS error: ${response.status}`);
    }

    logStep('Streaming response');

    // Stream the response directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar áudio';
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
