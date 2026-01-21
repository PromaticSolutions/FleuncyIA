import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert Uint8Array to base64 in chunks to prevent stack overflow
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 8192;
  let result = '';
  
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    result += String.fromCharCode(...chunk);
  }
  
  return btoa(result);
}

// Decode base64 to Uint8Array in chunks to prevent stack overflow
function base64ToUint8Array(base64String: string): Uint8Array {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, mimeType = 'audio/webm' } = await req.json();
    
    if (!audio) {
      throw new Error('Nenhum áudio fornecido');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    console.log('Processing audio, length:', audio.length);

    // Decode the incoming base64 audio
    const binaryAudio = base64ToUint8Array(audio);
    console.log('Decoded audio size:', binaryAudio.length, 'bytes');
    
    // Re-encode for Gemini API using chunked approach
    const base64Audio = uint8ArrayToBase64(binaryAudio);

    // Use Gemini for speech-to-text
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcreva o áudio a seguir em texto. Retorne APENAS o texto transcrito, sem explicações ou formatação adicional. Se não houver fala clara, retorne uma string vazia."
              },
              {
                type: "input_audio",
                input_audio: {
                  data: base64Audio,
                  format: mimeType.includes('webm') ? 'webm' : 'wav'
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Transcription error:", response.status, errorText);
      throw new Error(`Erro na transcrição: ${response.status}`);
    }

    const result = await response.json();
    const transcribedText = result.choices?.[0]?.message?.content?.trim() || '';
    console.log('Transcription result:', transcribedText.substring(0, 100));

    return new Response(
      JSON.stringify({ text: transcribedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Speech-to-text error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro na transcrição' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});