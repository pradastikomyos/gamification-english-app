-- Create a function to handle file uploads with elevated privileges
CREATE OR REPLACE FUNCTION upload_question_media(
    file_path TEXT,
    bucket_name TEXT DEFAULT 'question-media'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    user_profile profiles;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
    
    -- Check if user is teacher or admin
    IF user_profile.role NOT IN ('teacher', 'admin') THEN
        RETURN jsonb_build_object('error', 'Only teachers and admins can upload files');
    END IF;
    
    -- Return success - the actual file upload will be handled by client
    -- This function just validates permissions
    RETURN jsonb_build_object(
        'success', true, 
        'user_id', auth.uid()::text,
        'user_role', user_profile.role,
        'message', 'Upload permission granted'
    );
END;
$$;
