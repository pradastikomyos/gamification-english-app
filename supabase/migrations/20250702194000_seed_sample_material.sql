-- Insert a sample material into the materials table
INSERT INTO public.materials (title, description, content_url, created_by)
VALUES (
    'Introduction to Tenses',
    'A comprehensive guide to understanding the 12 basic tenses in English grammar, with examples and exercises.',
    'https://www.grammarly.com/blog/tenses-in-english/',
    (SELECT id FROM teachers LIMIT 1) -- Assign to the first teacher found
);
