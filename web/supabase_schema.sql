-- ==========================================================================
-- FOUNDERS ACADEMY SUPABASE DATABASE SCHEMA & SEED DATA
-- Project Ref: icdjgtfiqwwdqtvwuyaw
-- ==========================================================================

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Super Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Masterclass Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'ON',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Masterclasses Catalog Table
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  price TEXT NOT NULL,
  description TEXT,
  tg_channel TEXT,
  tg_group TEXT,
  status TEXT DEFAULT 'ON',
  enrolled_students INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Student Roster Directory Table
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  joined_date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Global System Maintenance Table
CREATE TABLE IF NOT EXISTS public.maintenance (
  id INT PRIMARY KEY DEFAULT 1,
  status TEXT DEFAULT 'OFF',
  title TEXT DEFAULT 'System Under Scheduled Upgrades & Maintenance',
  message TEXT DEFAULT 'We are currently upgrading Founders Academy infrastructure. Access will resume shortly.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Financial Transactions & Revenue Audit Ledger (Verify.ET Integrated)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_phone TEXT,
  student_email TEXT,
  masterclass_title TEXT NOT NULL,
  course_id TEXT,
  amount TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  account_suffix TEXT,
  status TEXT DEFAULT 'Completed',
  verify_et_status TEXT DEFAULT 'VERIFIED',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- INITIAL SEED DATA
-- ==========================================================================

-- Seed Admin Account (admin / admin123)
INSERT INTO public.admin_users (username, password, role)
VALUES ('admin', 'admin123', 'Super Admin')
ON CONFLICT (username) DO NOTHING;

-- Seed Categories
INSERT INTO public.categories (id, name, status) VALUES
  ('cat-1', 'Digital Marketing / SMMA', 'ON'),
  ('cat-2', 'Video Editing & VFX', 'ON'),
  ('cat-3', 'Content Creation', 'ON'),
  ('cat-4', 'Graphic Design', 'ON'),
  ('cat-5', 'AI & Automation', 'ON')
ON CONFLICT (id) DO NOTHING;

-- Seed Masterclasses Catalog
INSERT INTO public.courses (id, title, category, price, description, tg_channel, tg_group, status, enrolled_students) VALUES
  ('course-smma-accelerator', 'SMMA & Agency Growth Accelerator', 'Digital Marketing / SMMA', '10,000 ETB', 'Master high-ticket client acquisition, outreach scripts, cold email infrastructure, and agency team scaling.', 'https://t.me/founders_smma_channel', 'https://t.me/founders_smma_group', 'ON', 1840),
  ('course-video-editing', 'Video Editing & Post-Production Masterclass', 'Video Editing & VFX', '8,500 ETB', 'Professional Adobe Premiere Pro, After Effects, color grading, sound design, and viral short-form editing.', 'https://t.me/founders_video_channel', 'https://t.me/founders_video_group', 'ON', 1420),
  ('course-content-creation', 'Content Creation & Short Form Viral Blueprint', 'Content Creation', '6,500 ETB', 'Algorithm secrets, hook mastery, camera gear setups, and monetizing TikTok & Instagram Reels.', 'https://t.me/founders_content_channel', 'https://t.me/founders_content_group', 'ON', 980),
  ('course-graphic-design', 'Graphic Design & Brand Identity Mastery', 'Graphic Design', '7,000 ETB', 'Photoshop, Illustrator, logo systems, typography, and premium brand presentation strategy.', 'https://t.me/founders_design_channel', 'https://t.me/founders_design_group', 'ON', 750),
  ('course-ai-automation', 'AI Automation & Agency Bot Systems', 'AI & Automation', '9,500 ETB', 'Build custom ChatGPT bots, Make.com automations, CRM integrations, and AI workflow tools.', 'https://t.me/founders_ai_channel', 'https://t.me/founders_ai_group', 'ON', 520)
ON CONFLICT (id) DO NOTHING;

-- Seed Maintenance Status
INSERT INTO public.maintenance (id, status, title, message)
VALUES (1, 'OFF', 'System Under Scheduled Upgrades & Maintenance', 'We are currently upgrading Founders Academy infrastructure. Access will resume shortly.')
ON CONFLICT (id) DO NOTHING;

-- 7. Telegram Bot Users Table
CREATE TABLE IF NOT EXISTS public.telegram_users (
  telegram_id BIGINT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  username TEXT,
  phone_number TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Course Quizzes Table
CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_mins INT DEFAULT 15,
  passing_score INT DEFAULT 70,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INT DEFAULT 10,
  sort_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Quiz Submissions / Results Table
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  score INT NOT NULL,
  total_questions INT NOT NULL,
  passed BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Course Bundles & Packages Table
CREATE TABLE IF NOT EXISTS public.course_bundles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  main_course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  included_course_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'ON',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for Public Read Access
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_bundles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read courses" ON public.courses;
CREATE POLICY "Allow public read courses" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read maintenance" ON public.maintenance;
CREATE POLICY "Allow public read maintenance" ON public.maintenance FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public all students" ON public.students;
CREATE POLICY "Allow public all students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all telegram_users" ON public.telegram_users;
CREATE POLICY "Allow public all telegram_users" ON public.telegram_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all course_quizzes" ON public.course_quizzes;
CREATE POLICY "Allow public all course_quizzes" ON public.course_quizzes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all quiz_questions" ON public.quiz_questions;
CREATE POLICY "Allow public all quiz_questions" ON public.quiz_questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all quiz_submissions" ON public.quiz_submissions;
CREATE POLICY "Allow public all quiz_submissions" ON public.quiz_submissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read course_bundles" ON public.course_bundles;
CREATE POLICY "Allow public read course_bundles" ON public.course_bundles FOR SELECT USING (true);



