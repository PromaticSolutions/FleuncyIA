-- Drop and recreate the user_rankings view with security_invoker enabled
-- This ensures authenticated users can query the view properly
DROP VIEW IF EXISTS public.user_rankings;

CREATE VIEW public.user_rankings
WITH (security_invoker = on)
AS
SELECT 
    user_id,
    name,
    total_conversations,
    current_streak,
    longest_streak,
    current_adaptive_level,
    average_score
FROM user_profiles;

-- Grant select to authenticated users (the underlying RLS on user_profiles won't block this view)
GRANT SELECT ON public.user_rankings TO authenticated;

-- Since the view needs to show ALL users for ranking (not just the current user),
-- we need to create a policy that allows reading basic ranking data from all users
-- First, let's create a read-only policy specifically for ranking data

-- Create an RLS policy on user_profiles that allows SELECT for the view columns only
-- This is tricky because RLS applies per-row... 
-- Actually, the current RLS blocks users from seeing other users' profiles

-- The solution: The view should bypass RLS to show public ranking data
-- We need to recreate it as SECURITY DEFINER equivalent using a function

-- Drop the view again
DROP VIEW IF EXISTS public.user_rankings;

-- Create a SECURITY DEFINER function to get rankings (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_all_user_rankings()
RETURNS TABLE (
    user_id uuid,
    name text,
    total_conversations integer,
    current_streak integer,
    longest_streak integer,
    current_adaptive_level text,
    average_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        user_id,
        name,
        total_conversations,
        current_streak,
        longest_streak,
        current_adaptive_level,
        average_score
    FROM user_profiles
    ORDER BY total_conversations DESC
    LIMIT 100;
$$;

-- Recreate the view using the function
CREATE VIEW public.user_rankings AS
SELECT * FROM public.get_all_user_rankings();

-- Grant access
GRANT SELECT ON public.user_rankings TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_user_rankings() TO authenticated;