CREATE TABLE public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- e.g., 'article', 'video', 'audio', 'quiz', 'interactive'
    category TEXT NOT NULL, -- e.g., 'grammar', 'vocabulary', 'conversation', 'business', 'pronunciation', 'writing'
    difficulty TEXT NOT NULL, -- e.g., 'beginner', 'intermediate', 'advanced'
    estimated_time INTEGER, -- in minutes
    url TEXT, -- URL for external materials (video, article, etc.)
    content TEXT, -- direct content for internal articles, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
