import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rotating daily messages for engagement
const dailyMessages = [
  { title: '🔥 Hora de praticar!', body: 'Sua missão de hoje ainda não foi concluída 👊' },
  { title: '📊 Ranking em risco!', body: 'Seu ranking pode cair hoje — pratique agora!' },
  { title: '👥 Seus amigos já praticaram!', body: 'Seus amigos já praticaram hoje. E você?' },
  { title: '🎯 Meta semanal', body: 'Não perca sua sequência! Uma conversa rápida faz toda diferença.' },
  { title: '💪 Evolua seu inglês', body: 'Dedicar 5 minutos agora pode mudar seu nível. Vamos lá?' },
  { title: '🏆 Continue subindo!', body: 'Você está progredindo! Mantenha o ritmo hoje.' },
  { title: '📈 Sua fluência espera!', body: 'Cada conversa conta. Pratique agora e veja a diferença!' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get all users with push subscriptions who haven't practiced today
    const today = new Date().toISOString().split('T')[0];
    
    const { data: subscribedUsers, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id')
      .order('user_id');

    if (subError) throw subError;
    if (!subscribedUsers || subscribedUsers.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscribed users', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(subscribedUsers.map(s => s.user_id))];

    // Check which users haven't practiced today
    const { data: activeUsers } = await supabase
      .from('user_profiles')
      .select('user_id')
      .in('user_id', uniqueUserIds)
      .eq('last_practice_date', today);

    const activeUserIds = new Set((activeUsers || []).map(u => u.user_id));
    const inactiveUserIds = uniqueUserIds.filter(id => !activeUserIds.has(id));

    if (inactiveUserIds.length === 0) {
      return new Response(JSON.stringify({ message: 'All users practiced today', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pick a rotating message based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const message = dailyMessages[dayOfYear % dailyMessages.length];

    // Call send-push-notification to send to inactive users
    const pushUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`;
    const response = await fetch(pushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        userIds: inactiveUserIds,
        title: message.title,
        body: message.body,
        url: '/home',
        tag: 'daily-reminder',
      }),
    });

    const result = await response.json();
    console.log(`[DailyPush] Sent to ${result.sent}/${inactiveUserIds.length} inactive users`);

    return new Response(JSON.stringify({ 
      inactiveUsers: inactiveUserIds.length,
      ...result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[DailyPush] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
