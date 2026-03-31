UPDATE public.students
SET user_id = (
    SELECT id
    FROM auth.users
    WHERE email = 'siswa@siswa.com'
)
WHERE email = 'siswa@siswa.com';
