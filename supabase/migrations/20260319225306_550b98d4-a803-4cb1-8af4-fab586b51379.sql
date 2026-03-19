CREATE TABLE public.feedback_exit_intent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT,
  page_title TEXT,
  nome TEXT,
  email TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_message TEXT NOT NULL,
  user_agent TEXT,
  device_type TEXT,
  session_id TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_exit_intent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert exit intent feedback"
  ON public.feedback_exit_intent
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all exit intent feedback"
  ON public.feedback_exit_intent
  FOR SELECT
  USING (is_admin(auth.uid()));