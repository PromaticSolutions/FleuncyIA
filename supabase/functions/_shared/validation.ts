// Shared validation schemas for all edge functions
// Using Zod for strict runtime validation

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Valid enums
export const VALID_LANGUAGES = ['english', 'spanish', 'french', 'italian', 'german'] as const;
export const VALID_SCENARIOS = ['restaurant', 'interview', 'hotel', 'airport', 'shopping', 'business', 'hospital', 'transport'] as const;
export const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'basic', 'intermediate', 'advanced'] as const;
export const VALID_MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;

// Message schema with size limits
export const MessageSchema = z.object({
  role: z.enum(VALID_MESSAGE_ROLES),
  content: z.string().min(1).max(4000), // Max 4000 chars per message
});

// Chat request validation
export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100), // Max 100 messages
  scenarioId: z.enum(VALID_SCENARIOS),
  userLevel: z.enum(VALID_LEVELS).optional(),
  userLanguage: z.enum(VALID_LANGUAGES).optional().default('english'),
  adaptiveLevel: z.enum(VALID_LEVELS).optional(),
  includeInstantFeedback: z.boolean().optional().default(false),
  uiLanguage: z.string().optional(), // UI language for feedback (pt-BR or en)
});

// Analyze conversation request validation
export const AnalyzeRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  scenarioId: z.enum(VALID_SCENARIOS),
  userLevel: z.enum(VALID_LEVELS).optional(),
  userLanguage: z.enum(VALID_LANGUAGES).optional().default('english'),
});

// Support chat request validation
export const SupportChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(2000),
  })).min(1).max(50),
  userName: z.string().min(1).max(100).optional(),
  ticketId: z.string().uuid().optional(),
});

// Text-to-speech request validation
export const TTSRequestSchema = z.object({
  text: z.string().min(1).max(5000), // Max 5000 chars
  language: z.enum(VALID_LANGUAGES).optional().default('english'),
});

// Speech-to-text request validation
export const STTRequestSchema = z.object({
  audio: z.string().min(1).max(15 * 1024 * 1024), // Max ~15MB base64 (~11MB binary)
  mimeType: z.string().refine(
    (val) => val.startsWith('audio/'),
    { message: 'Invalid audio MIME type' }
  ).optional().default('audio/webm'),
  language: z.enum(VALID_LANGUAGES).optional().default('english'),
});

// Helper function to create validation error response
export function createValidationErrorResponse(
  error: z.ZodError,
  corsHeaders: Record<string, string>
): Response {
  const issues = error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  return new Response(
    JSON.stringify({
      error: 'Validation error',
      details: issues,
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Helper to safely parse and validate request body
export async function validateRequest<T>(
  req: Request,
  schema: z.ZodSchema<T>,
  corsHeaders: Record<string, string>
): Promise<{ data: T } | { error: Response }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return { error: createValidationErrorResponse(result.error, corsHeaders) };
    }
    
    return { data: result.data };
  } catch {
    return {
      error: new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      ),
    };
  }
}

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type SupportChatRequest = z.infer<typeof SupportChatRequestSchema>;
export type TTSRequest = z.infer<typeof TTSRequestSchema>;
export type STTRequest = z.infer<typeof STTRequestSchema>;
