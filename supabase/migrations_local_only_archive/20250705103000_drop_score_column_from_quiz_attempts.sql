-- Migration: Drop legacy score column from quiz_attempts
ALTER TABLE public.quiz_attempts
DROP COLUMN IF EXISTS score;
