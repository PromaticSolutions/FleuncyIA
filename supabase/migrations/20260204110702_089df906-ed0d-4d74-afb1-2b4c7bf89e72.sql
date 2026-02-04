-- Add voice_enabled column to user_settings to persist voice preference
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN NOT NULL DEFAULT true;

-- Update existing records to have a default value
UPDATE public.user_settings 
SET voice_enabled = true 
WHERE voice_enabled IS NULL;