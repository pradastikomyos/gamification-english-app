-- Create study-materials storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'study-materials',
    'study-materials', 
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'audio/mpeg', 'audio/wav', 'audio/mp3']
);
