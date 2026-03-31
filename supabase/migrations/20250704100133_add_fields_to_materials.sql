ALTER TABLE public.materials
ADD COLUMN type TEXT,
ADD COLUMN category TEXT,
ADD COLUMN difficulty TEXT,
ADD COLUMN estimated_time INTEGER,
ADD COLUMN rating NUMERIC(2, 1) DEFAULT 0.0;
