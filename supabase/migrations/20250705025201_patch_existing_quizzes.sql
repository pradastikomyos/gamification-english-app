-- Perbaiki kuis yang sudah ada
UPDATE quizzes
SET teacher_id = (
  SELECT id 
  FROM teachers 
  WHERE user_id = '73569530-8afd-497e-abce-906afc5035e7'
)
WHERE teacher_id IS NULL AND created_by = '73569530-8afd-497e-abce-906afc5035e7';
