-- Founders Academy Supabase PostgreSQL Database Schema DDL Migration Script
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/icdjgtfiqwwdqtvwuyaw/sql

-- 1. Landing Page Configuration Table
CREATE TABLE IF NOT EXISTS landing_config (
  id INT PRIMARY KEY DEFAULT 1,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Masterclasses / Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  price TEXT NOT NULL,
  duration TEXT,
  description TEXT NOT NULL,
  tg_channel TEXT,
  tg_group TEXT,
  status TEXT DEFAULT 'ON',
  enrolled_students INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'ON',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Students Directory Table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  joined_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_phone TEXT,
  student_email TEXT,
  masterclass_title TEXT NOT NULL,
  course_id TEXT,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  account_suffix TEXT,
  amount TEXT NOT NULL,
  status TEXT DEFAULT 'Completed',
  verify_et_status TEXT DEFAULT 'VERIFIED',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Maintenance State Table
CREATE TABLE IF NOT EXISTS maintenance (
  id INT PRIMARY KEY DEFAULT 1,
  status TEXT DEFAULT 'OFF',
  title TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Course Quizzes Table
CREATE TABLE IF NOT EXISTS course_quizzes (
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

-- 8. Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
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

-- 9. Quiz Submissions Table
CREATE TABLE IF NOT EXISTS quiz_submissions (
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

-- Disable RLS for anon development access
ALTER TABLE landing_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions DISABLE ROW LEVEL SECURITY;

