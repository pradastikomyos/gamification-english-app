-- Add total_questions and total_points columns to quizzes table
ALTER TABLE quizzes ADD COLUMN total_questions INTEGER DEFAULT 0;
ALTER TABLE quizzes ADD COLUMN total_points INTEGER DEFAULT 0;
