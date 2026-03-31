-- Perbarui profil ke ID yang valid
UPDATE public.profiles 
SET id = '73569530-8afd-497e-abce-906afc5035e7'
WHERE id = 'ce54c9c3-a89d-4201-a340-37dfdd3f69cf';

-- Perbarui referensi di teachers
UPDATE public.teachers
SET user_id = '73569530-8afd-497e-abce-906afc5035e7'
WHERE user_id = 'ce54c9c3-a89d-4201-a340-37dfdd3f69cf';

-- Perbaiki quizzes yang ada
WITH fixed_teacher AS (
  SELECT id FROM public.teachers 
  WHERE user_id = '73569530-8afd-497e-abce-906afc5035e7'
)
UPDATE public.quizzes
SET teacher_id = (SELECT id FROM fixed_teacher)
WHERE teacher_id IS NULL;
