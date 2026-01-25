-- Create a security definer function to find user by email
-- Returns only the user_id, never exposes other profile data
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.user_profiles
  WHERE LOWER(email) = LOWER(_email)
  LIMIT 1
$$;