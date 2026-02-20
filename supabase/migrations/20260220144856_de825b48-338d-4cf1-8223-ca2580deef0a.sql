
DROP FUNCTION IF EXISTS public.get_all_user_rankings();

CREATE FUNCTION public.get_all_user_rankings()
 RETURNS TABLE(user_id uuid, name text, avatar_url text, total_conversations integer, current_streak integer, longest_streak integer, current_adaptive_level text, average_score numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
    SELECT 
        user_id,
        name,
        avatar_url,
        total_conversations,
        current_streak,
        longest_streak,
        current_adaptive_level,
        average_score
    FROM user_profiles
    ORDER BY total_conversations DESC
    LIMIT 100;
$$;
