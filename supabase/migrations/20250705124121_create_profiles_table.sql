CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')) DEFAULT 'student'
);

COMMENT ON TABLE public.profiles IS 'Stores user roles for access control';

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Teachers/admins can manage profiles" ON public.profiles
    FOR ALL TO authenticated USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'admin')
    ) WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'admin')
    );
