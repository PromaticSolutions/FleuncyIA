
-- Drop and recreate the user_rankings view to include avatar_url
DROP VIEW IF EXISTS public.user_rankings;

CREATE VIEW public.user_rankings WITH (security_invoker = on) AS
SELECT 
  user_id,
  name,
  avatar_url,
  total_conversations,
  current_streak,
  longest_streak,
  current_adaptive_level,
  average_score
FROM public.user_profiles
ORDER BY total_conversations DESC;
