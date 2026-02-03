-- Corrigir políticas RLS das tabelas de analytics (apenas admins)
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Service role can manage events" ON public.analytics_events;

-- Política para inserir eventos (todos podem inserir seus próprios eventos)
CREATE POLICY "Users can insert own session"
ON public.analytics_sessions
FOR INSERT
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Admins podem ver todos os dados de analytics
CREATE POLICY "Admins can view all sessions"
ON public.analytics_sessions
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own events"
ON public.analytics_events
FOR INSERT
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Admins can view all events"
ON public.analytics_events
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Permitir admins gerenciarem admin_users
CREATE POLICY "Admins can insert admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update admin users"
ON public.admin_users
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete admin users"
ON public.admin_users
FOR DELETE
USING (public.is_admin(auth.uid()));