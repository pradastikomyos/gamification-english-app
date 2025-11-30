-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

-- Create enum for difficulty levels
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Create teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table (extending auth.users)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  student_id VARCHAR UNIQUE NOT NULL,
  class_id UUID REFERENCES classes(id),
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  last_login TIMESTAMP WITH TIME ZONE,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table to track roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  profile_id UUID, -- Will reference either students.id or teachers.id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  difficulty difficulty_level DEFAULT 'medium',
  time_limit INTEGER DEFAULT 600, -- seconds
  points_per_question INTEGER DEFAULT 10,
  created_by UUID REFERENCES teachers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a VARCHAR NOT NULL,
  option_b VARCHAR NOT NULL,
  option_c VARCHAR NOT NULL,
  option_d VARCHAR NOT NULL,
  correct_answer VARCHAR NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  quiz_id UUID REFERENCES quizzes(id),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER, -- seconds
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  badge_icon VARCHAR,
  requirements JSONB,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_quizzes table for assignments
CREATE TABLE class_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  UNIQUE(class_id, quiz_id)
);

-- Enable Row Level Security
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_quizzes ENABLE ROW LEVEL SECURITY;

-- Create helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create helper function to get user profile id
CREATE OR REPLACE FUNCTION get_user_profile_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT profile_id FROM user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- RLS Policies for teachers
CREATE POLICY "Teachers can view their own data" ON teachers
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = teachers.id AND role = 'teacher'));

CREATE POLICY "Teachers can update their own data" ON teachers
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = teachers.id AND role = 'teacher'));

-- RLS Policies for students
CREATE POLICY "Students can view their own data" ON students
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = students.id AND role = 'student'));

CREATE POLICY "Students can update their own data" ON students
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = students.id AND role = 'student'));

-- RLS Policies for classes
CREATE POLICY "Teachers can view their own classes" ON classes
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = teacher_id AND role = 'teacher'));

CREATE POLICY "Teachers can manage their own classes" ON classes
  FOR ALL USING (auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = teacher_id AND role = 'teacher'));

-- RLS Policies for quizzes
CREATE POLICY "Teachers can view their own quizzes" ON quizzes
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = created_by AND role = 'teacher'));

CREATE POLICY "Teachers can manage their own quizzes" ON quizzes
  FOR ALL USING (auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = created_by AND role = 'teacher'));

-- RLS Policies for questions
CREATE POLICY "Teachers can view questions for their quizzes" ON questions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = quiz_id 
    AND auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = created_by AND role = 'teacher')
  ));

CREATE POLICY "Teachers can manage questions for their quizzes" ON questions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = quiz_id 
    AND auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = created_by AND role = 'teacher')
  ));

-- RLS Policies for user_progress
CREATE POLICY "Students can view their own progress" ON user_progress
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = student_id AND role = 'student'));

CREATE POLICY "Students can insert their own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = student_id AND role = 'student'));

-- RLS Policies for user_achievements
CREATE POLICY "Students can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = student_id AND role = 'student'));

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- RLS Policies for class_quizzes
CREATE POLICY "Teachers can manage class quiz assignments" ON class_quizzes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = class_id 
    AND auth.uid() = (SELECT user_id FROM user_roles WHERE profile_id = teacher_id AND role = 'teacher')
  ));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);
