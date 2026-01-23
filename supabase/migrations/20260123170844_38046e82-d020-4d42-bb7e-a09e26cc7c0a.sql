-- Drop existing problematic policies
DROP POLICY IF EXISTS "Group members can view other members" ON public.group_members;
DROP POLICY IF EXISTS "Anyone can view groups they are member of" ON public.evolution_groups;

-- Create a security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
  )
$$;

-- Create a security definer function to get user's group IDs
CREATE OR REPLACE FUNCTION public.get_user_group_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id
  FROM public.group_members
  WHERE user_id = _user_id
$$;

-- Create a security definer function to check if user created the group
CREATE OR REPLACE FUNCTION public.is_group_creator(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.evolution_groups
    WHERE id = _group_id
      AND created_by = _user_id
  )
$$;

-- Recreate group_members SELECT policy using the security definer function
CREATE POLICY "Group members can view other members"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  public.is_group_member(auth.uid(), group_id)
  OR user_id = auth.uid()
);

-- Recreate evolution_groups SELECT policy using the security definer function
CREATE POLICY "Anyone can view groups they are member of"
ON public.evolution_groups
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR id IN (SELECT public.get_user_group_ids(auth.uid()))
);