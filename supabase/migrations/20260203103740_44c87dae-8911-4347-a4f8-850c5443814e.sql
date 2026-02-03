-- Tabela de sessões de analytics
CREATE TABLE public.analytics_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  duration_seconds integer DEFAULT 0,
  source_channel text DEFAULT 'direct',
  device_type text,
  browser text,
  country text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de eventos de analytics
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id uuid,
  event_name text NOT NULL,
  event_category text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de roles de admin
CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  permissions jsonb DEFAULT '["metrics_read", "metrics_write", "export"]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Índices para performance
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_sessions_user_id ON public.analytics_sessions(user_id);
CREATE INDEX idx_analytics_sessions_started_at ON public.analytics_sessions(started_at);

-- RLS para analytics_sessions
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage sessions"
ON public.analytics_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS para analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage events"
ON public.analytics_events
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS para admin_users (apenas admins veem)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin users"
ON public.admin_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
  )
$$;

-- Função para obter métricas de DAU/WAU/MAU
CREATE OR REPLACE FUNCTION public.get_active_users_metrics(
  _start_date timestamp with time zone DEFAULT now() - interval '30 days',
  _end_date timestamp with time zone DEFAULT now()
)
RETURNS TABLE(
  daily_active_users bigint,
  weekly_active_users bigint,
  monthly_active_users bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (SELECT COUNT(DISTINCT user_id) FROM analytics_sessions WHERE started_at >= now() - interval '1 day' AND user_id IS NOT NULL) as daily_active_users,
    (SELECT COUNT(DISTINCT user_id) FROM analytics_sessions WHERE started_at >= now() - interval '7 days' AND user_id IS NOT NULL) as weekly_active_users,
    (SELECT COUNT(DISTINCT user_id) FROM analytics_sessions WHERE started_at >= now() - interval '30 days' AND user_id IS NOT NULL) as monthly_active_users
$$;

-- Função para obter retenção
CREATE OR REPLACE FUNCTION public.get_retention_metrics()
RETURNS TABLE(
  retention_d1 numeric,
  retention_d7 numeric,
  retention_d30 numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH first_sessions AS (
    SELECT user_id, MIN(started_at::date) as first_date
    FROM analytics_sessions
    WHERE user_id IS NOT NULL
    GROUP BY user_id
  ),
  retention AS (
    SELECT 
      fs.user_id,
      fs.first_date,
      CASE WHEN EXISTS (
        SELECT 1 FROM analytics_sessions s 
        WHERE s.user_id = fs.user_id 
        AND s.started_at::date = fs.first_date + interval '1 day'
      ) THEN 1 ELSE 0 END as returned_d1,
      CASE WHEN EXISTS (
        SELECT 1 FROM analytics_sessions s 
        WHERE s.user_id = fs.user_id 
        AND s.started_at::date = fs.first_date + interval '7 days'
      ) THEN 1 ELSE 0 END as returned_d7,
      CASE WHEN EXISTS (
        SELECT 1 FROM analytics_sessions s 
        WHERE s.user_id = fs.user_id 
        AND s.started_at::date = fs.first_date + interval '30 days'
      ) THEN 1 ELSE 0 END as returned_d30
    FROM first_sessions fs
  )
  SELECT 
    COALESCE(ROUND(AVG(returned_d1) * 100, 1), 0) as retention_d1,
    COALESCE(ROUND(AVG(returned_d7) * 100, 1), 0) as retention_d7,
    COALESCE(ROUND(AVG(returned_d30) * 100, 1), 0) as retention_d30
  FROM retention
$$;

-- Função para contar eventos por período
CREATE OR REPLACE FUNCTION public.get_events_count(
  _event_name text,
  _start_date timestamp with time zone DEFAULT now() - interval '30 days',
  _end_date timestamp with time zone DEFAULT now()
)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)
  FROM analytics_events
  WHERE event_name = _event_name
  AND created_at BETWEEN _start_date AND _end_date
$$;

-- Função para métricas de crescimento mensal
CREATE OR REPLACE FUNCTION public.get_growth_metrics()
RETURNS TABLE(
  current_month_users bigint,
  previous_month_users bigint,
  growth_rate numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH monthly_users AS (
    SELECT 
      (SELECT COUNT(DISTINCT user_id) FROM user_profiles WHERE created_at >= date_trunc('month', now())) as current_month,
      (SELECT COUNT(DISTINCT user_id) FROM user_profiles WHERE created_at >= date_trunc('month', now() - interval '1 month') AND created_at < date_trunc('month', now())) as previous_month
  )
  SELECT 
    current_month as current_month_users,
    previous_month as previous_month_users,
    CASE 
      WHEN previous_month > 0 THEN ROUND(((current_month - previous_month)::numeric / previous_month) * 100, 1)
      ELSE 0
    END as growth_rate
  FROM monthly_users
$$;