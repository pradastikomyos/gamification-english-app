-- Update bucket configuration for better file support
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'audio/mpeg', 
    'audio/wav', 
    'audio/mp3',
    'audio/ogg',
    'audio/aac',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm'
  ],
  file_size_limit = 10485760, -- 10MB limit
  public = true,
  avif_autodetection = false
WHERE id = 'question-media';

-- Ensure bucket exists and create if not
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'question-media',
  'question-media', 
  true,
  ARRAY[
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'audio/mpeg', 
    'audio/wav', 
    'audio/mp3',
    'audio/ogg',
    'audio/aac',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm'
  ],
  10485760
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit,
  public = EXCLUDED.public;
