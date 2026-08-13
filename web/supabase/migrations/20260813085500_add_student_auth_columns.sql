-- Add Auth & Telegram columns to public.students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS telegram_id TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS chat_id TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
