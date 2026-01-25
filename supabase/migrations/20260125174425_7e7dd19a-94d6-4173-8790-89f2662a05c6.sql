-- Create a security definer function to find group by invite code
-- Returns only the group id and name, enough to join
CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(_invite_code text)
RETURNS TABLE(id uuid, name text, max_members integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, max_members
  FROM public.evolution_groups
  WHERE LOWER(invite_code) = LOWER(_invite_code)
  LIMIT 1
$$;