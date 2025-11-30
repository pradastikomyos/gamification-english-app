CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    time_taken_seconds INTEGER NOT NULL,
    bonus_points INTEGER DEFAULT 0,
    final_score INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_quiz UNIQUE (student_id, quiz_id) -- Opsional: jika siswa hanya boleh mencoba sekali
);

COMMENT ON TABLE public.quiz_attempts IS 'Mencatat setiap percobaan pengerjaan kuis oleh siswa.';
COMMENT ON COLUMN public.quiz_attempts.final_score IS 'Skor akhir setelah ditambah bonus.';
