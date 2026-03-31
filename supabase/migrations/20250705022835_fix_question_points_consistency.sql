-- Fix question points to match difficulty levels consistently
UPDATE public.questions 
SET points = CASE 
    WHEN difficulty = 'easy' THEN 2
    WHEN difficulty = 'medium' THEN 3
    WHEN difficulty = 'hard' THEN 5
    ELSE points  -- Keep existing points for NULL difficulty
END
WHERE difficulty IS NOT NULL;
