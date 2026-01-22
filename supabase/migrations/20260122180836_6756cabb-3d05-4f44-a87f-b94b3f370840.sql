-- Fix evolution_groups SELECT policy (bug: group_members.group_id = group_members.id should be group_members.group_id = evolution_groups.id)
DROP POLICY IF EXISTS "Anyone can view groups they are member of" ON public.evolution_groups;
CREATE POLICY "Anyone can view groups they are member of"
ON public.evolution_groups FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = evolution_groups.id 
    AND group_members.user_id = auth.uid()
  )) 
  OR (created_by = auth.uid())
);

-- Fix group_members SELECT policy (bug: gm.group_id = gm.group_id is always true)
DROP POLICY IF EXISTS "Group members can view other members" ON public.group_members;
CREATE POLICY "Group members can view other members"
ON public.group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members my_membership
    WHERE my_membership.group_id = group_members.group_id 
    AND my_membership.user_id = auth.uid()
  )
);

-- Add policy for global ranking - allow viewing basic profile info for ranking
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

-- Create policy allowing users to view their own full profile
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Create policy allowing anyone to view basic ranking data (limited columns should be enforced in app)
CREATE POLICY "Anyone can view public ranking data" 
ON public.user_profiles FOR SELECT 
TO authenticated
USING (true);