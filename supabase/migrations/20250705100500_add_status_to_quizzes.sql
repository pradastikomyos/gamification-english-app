-- Add a 'status' column to the 'quizzes' table
ALTER TABLE public.quizzes
ADD COLUMN status TEXT DEFAULT 'open';

-- Create a type for the quiz status
CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'archived');

-- Add the 'status' column with the new type
ALTER TABLE public.quizzes
ADD COLUMN status quiz_status DEFAULT 'draft';
