-- Update all existing student levels based on their total_points
UPDATE public.students SET level = GREATEST(1, FLOOR(total_points / 100) + 1);
