import { supabase } from '@/integrations/supabase/client';

export interface ExitIntentFeedbackPayload {
  page_url: string;
  page_title: string;
  nome?: string;
  email?: string;
  rating?: number;
  feedback_message: string;
  user_agent?: string;
  device_type?: string;
  session_id?: string;
}

export async function saveExitIntentFeedback(payload: ExitIntentFeedbackPayload): Promise<void> {
  const { error } = await supabase.from('feedback_exit_intent').insert({
    page_url: payload.page_url,
    page_title: payload.page_title,
    nome: payload.nome || null,
    email: payload.email || null,
    rating: payload.rating || null,
    feedback_message: payload.feedback_message,
    user_agent: payload.user_agent || navigator.userAgent,
    device_type: payload.device_type || (window.innerWidth < 768 ? 'mobile' : 'desktop'),
    session_id: payload.session_id || sessionStorage.getItem('analytics_session_id') || null,
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}
