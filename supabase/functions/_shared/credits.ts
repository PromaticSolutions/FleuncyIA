// Server-side credit validation and enforcement
// This ensures credits are checked server-side, not just client-side

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export interface CreditCheckResult {
  allowed: boolean;
  reason?: string;
  remainingCredits?: number;
  remainingAudioCredits?: number;
  isPaidPlan: boolean;
}

// Plans that bypass credit checks
const PAID_PLANS = ['beginner', 'pro', 'fluency_plus'];

export async function checkAndDeductCredits(
  userId: string,
  isAudioRequest: boolean,
  corsHeaders: Record<string, string>
): Promise<{ result: CreditCheckResult } | { error: Response }> {
  // Create service role client for credit operations
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Check user's plan first
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('plan')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    console.log('[CREDITS] Profile not found', { userId, error: profileError?.message });
    return {
      error: new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  // Paid plans bypass credit checks
  if (PAID_PLANS.includes(profile.plan)) {
    console.log('[CREDITS] Paid plan, bypassing credit check', { userId, plan: profile.plan });
    return {
      result: {
        allowed: true,
        isPaidPlan: true,
      },
    };
  }

  // Free trial - check and deduct credits
  const { data: credits, error: creditsError } = await supabaseAdmin
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (creditsError || !credits) {
    console.log('[CREDITS] Credits not found', { userId, error: creditsError?.message });
    return {
      error: new Response(
        JSON.stringify({ error: 'Credits not initialized' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  // Check trial expiration
  const trialEndsAt = new Date(credits.trial_ends_at);
  if (new Date() > trialEndsAt) {
    console.log('[CREDITS] Trial expired', { userId, trialEndsAt });
    return {
      error: new Response(
        JSON.stringify({ error: 'Trial period expired. Please upgrade your plan.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  // Check remaining credits
  const remainingCredits = credits.total_credits - credits.used_credits;
  if (remainingCredits <= 0) {
    console.log('[CREDITS] Credits exhausted', { userId, remainingCredits });
    return {
      error: new Response(
        JSON.stringify({ error: 'Credits exhausted. Please upgrade your plan.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  // For audio requests, also check audio credits
  if (isAudioRequest) {
    const remainingAudioCredits = credits.total_audio_credits - credits.used_audio_credits;
    if (remainingAudioCredits <= 0) {
      console.log('[CREDITS] Audio credits exhausted', { userId, remainingAudioCredits });
      return {
        error: new Response(
          JSON.stringify({ error: 'Audio credits exhausted. Please upgrade your plan.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        ),
      };
    }

    // Deduct both credits atomically
    const { error: updateError } = await supabaseAdmin
      .from('user_credits')
      .update({
        used_credits: credits.used_credits + 1,
        used_audio_credits: credits.used_audio_credits + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.log('[CREDITS] Failed to deduct credits', { userId, error: updateError.message });
      return {
        error: new Response(
          JSON.stringify({ error: 'Failed to process credits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        ),
      };
    }

    console.log('[CREDITS] Audio credits deducted', { userId, remaining: remainingCredits - 1, audioRemaining: remainingAudioCredits - 1 });

    return {
      result: {
        allowed: true,
        remainingCredits: remainingCredits - 1,
        remainingAudioCredits: remainingAudioCredits - 1,
        isPaidPlan: false,
      },
    };
  }

  // Deduct regular credit
  const { error: updateError } = await supabaseAdmin
    .from('user_credits')
    .update({
      used_credits: credits.used_credits + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    console.log('[CREDITS] Failed to deduct credits', { userId, error: updateError.message });
    return {
      error: new Response(
        JSON.stringify({ error: 'Failed to process credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  console.log('[CREDITS] Credit deducted', { userId, remaining: remainingCredits - 1 });

  return {
    result: {
      allowed: true,
      remainingCredits: remainingCredits - 1,
      isPaidPlan: false,
    },
  };
}
