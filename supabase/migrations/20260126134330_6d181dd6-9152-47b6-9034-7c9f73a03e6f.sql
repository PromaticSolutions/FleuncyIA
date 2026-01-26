-- Create a trigger function to prevent direct plan updates from regular users
-- Only service_role can update the plan field
CREATE OR REPLACE FUNCTION public.prevent_plan_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow plan field updates via service_role (webhook/admin operations)
  -- Regular users (anon, authenticated) cannot update the plan field
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    -- Check if this is a service_role request
    -- The service_role key bypasses RLS, so we check the JWT role claim
    IF current_setting('request.jwt.claims', true)::json->>'role' = 'authenticated' OR
       current_setting('request.jwt.claims', true)::json->>'role' = 'anon' THEN
      -- Revert the plan change - keep the old value
      NEW.plan := OLD.plan;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger on user_profiles table
DROP TRIGGER IF EXISTS prevent_plan_update_trigger ON public.user_profiles;
CREATE TRIGGER prevent_plan_update_trigger
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_plan_update();