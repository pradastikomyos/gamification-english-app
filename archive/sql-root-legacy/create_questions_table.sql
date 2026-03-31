CREATE TABLE public.questions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    quiz_id uuid NOT NULL,
    question_text text NOT NULL,
    options jsonb NOT NULL,
    correct_answer text NOT NULL,
    difficulty text,
    points integer,
    "order" integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT questions_pkey PRIMARY KEY (id),
    CONSTRAINT questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for the questions table

CREATE POLICY "Teachers can view questions for their own quizzes"
ON public.questions FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = questions.quiz_id AND quizzes.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can insert questions for their own quizzes"
ON public.questions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = questions.quiz_id AND quizzes.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update questions for their own quizzes"
ON public.questions FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = questions.quiz_id AND quizzes.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete questions for their own quizzes"
ON public.questions FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = questions.quiz_id AND quizzes.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view questions for assigned quizzes"
ON public.questions FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.class_quizzes cq
    JOIN public.students s ON cq.class_id = s.class_id
    WHERE cq.quiz_id = questions.quiz_id AND s.user_id = auth.uid()
  )
);
