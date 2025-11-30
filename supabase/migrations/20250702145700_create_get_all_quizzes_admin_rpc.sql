CREATE OR REPLACE FUNCTION public.get_all_quizzes_admin()
RETURNS SETOF quizzes
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT * FROM public.quizzes;
$function$;
