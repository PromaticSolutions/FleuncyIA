
-- Criar trigger para criar perfil e settings automaticamente quando um novo usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar perfil padrão
  INSERT INTO public.user_profiles (
    user_id,
    name,
    email,
    language,
    level,
    weekly_goal,
    plan,
    has_completed_onboarding,
    current_adaptive_level,
    total_conversations,
    average_score
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    'english',
    'basic',
    5,
    'free_trial',
    false,
    'A1',
    0,
    0
  );
  
  -- Criar settings padrão
  INSERT INTO public.user_settings (
    user_id,
    theme,
    notifications_enabled,
    voice_enabled
  ) VALUES (
    NEW.id,
    'light',
    true,
    false
  );
  
  -- Criar créditos iniciais de trial
  INSERT INTO public.user_credits (
    user_id,
    total_credits,
    used_credits,
    trial_started_at,
    trial_ends_at
  ) VALUES (
    NEW.id,
    70,
    0,
    NOW(),
    NOW() + INTERVAL '7 days'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migrar usuários existentes que não têm perfil
INSERT INTO public.user_profiles (
  user_id,
  name,
  email,
  language,
  level,
  weekly_goal,
  plan,
  has_completed_onboarding,
  current_adaptive_level,
  total_conversations,
  average_score
)
SELECT 
  uc.user_id,
  'Usuário',
  NULL,
  'english',
  'basic',
  5,
  'free_trial',
  false,
  'A1',
  0,
  0
FROM public.user_credits uc
LEFT JOIN public.user_profiles up ON uc.user_id = up.user_id
WHERE up.user_id IS NULL;

-- Migrar settings para usuários que não têm
INSERT INTO public.user_settings (
  user_id,
  theme,
  notifications_enabled,
  voice_enabled
)
SELECT 
  uc.user_id,
  'light',
  true,
  false
FROM public.user_credits uc
LEFT JOIN public.user_settings us ON uc.user_id = us.user_id
WHERE us.user_id IS NULL;
