-- Add audio credits tracking for free trial users
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS total_audio_credits integer NOT NULL DEFAULT 14,
ADD COLUMN IF NOT EXISTS used_audio_credits integer NOT NULL DEFAULT 0;