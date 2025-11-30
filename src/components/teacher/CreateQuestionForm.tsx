import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Option {
  text: string;
  isCorrect: boolean;
}

interface CreateQuestionFormProps {
  quizId: string;
  isOpen: boolean;
  onClose: () => void;
  onQuestionCreated: () => void;
  isAdmin?: boolean;
}

const CreateQuestionForm = ({ quizId, isOpen, onClose, onQuestionCreated, isAdmin = false }: CreateQuestionFormProps) => {
  const [questionName, setQuestionName] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [points, setPoints] = useState(2);
  const [options, setOptions] = useState<Option[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [explanation, setExplanation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    switch (difficulty) {
      case 'easy':
        setPoints(2);
        break;
      case 'medium':
        setPoints(3);
        break;
      case 'hard':
        setPoints(5);
        break;
    }
  }, [difficulty]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setQuestionName('');
      setDifficulty('easy');
      setPoints(2);
      setOptions([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
      setSelectedFile(null);
      setYoutubeUrl('');
      setExplanation('');
      setError(null);
      setFileSelected(false);
      setPreviewUrl(null);
    }
  }, [isOpen]);

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const handleCorrectOptionChange = (index: number) => {
    const newOptions = options.map((option, i) => ({
      ...option,
      isCorrect: i === index,
    }));
    setOptions(newOptions);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileSelected(true);
      setYoutubeUrl('');
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setSelectedFile(null);
      setFileSelected(false);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploading(true);

    let mediaUrl: string | null = null;

    try {
      // 1. Get user and verify authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!user) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Debug: Log current user info
      console.log('Current user in CreateQuestionForm:', user?.id, user?.email);
      console.log('User metadata:', user?.user_metadata);

      // Check session validity
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No valid session found. Please log in again.');
      }
      
      console.log('Session is valid:', !!session.session);

      // 2. Verify user is a teacher by checking the teachers table
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('user_id', user.id)
        .single();

      if (teacherError || !teacherData) {
        console.error('Teacher verification error:', teacherError);
        throw new Error('Only teachers can create questions. Teacher record not found.');
      }

      console.log('Teacher verified:', teacherData);
      console.log('Teacher ID:', teacherData.id);
      console.log('Teacher name:', teacherData.name);

      // 3. Handle media URL from YouTube link or file upload
      if (youtubeUrl.trim()) {
        mediaUrl = youtubeUrl.trim();
        console.log('Using YouTube URL:', mediaUrl);
      } else if (selectedFile) {
        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/mp3'];
        if (!allowedTypes.includes(selectedFile.type)) {
          throw new Error('File type not supported. Please upload an image (JPEG, PNG, GIF, WebP) or audio file (MP3, WAV).');
        }

        if (selectedFile.size > 10485760) { // 10MB
          throw new Error('File size too large. Maximum size is 10MB.');
        }

        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log('Uploading file:', fileName, 'Size:', selectedFile.size, 'Type:', selectedFile.type);
        console.log('Teacher verified:', teacherData.name);
        console.log('File path for upload:', filePath);

        // Try to upload the file to Supabase Storage
        console.log('🔍 About to upload file to bucket: question-media');
        console.log('🔍 File path:', filePath);
        console.log('🔍 User ID:', user.id);
        console.log('🔍 Teacher ID:', teacherData.id);

        // Get current session token for debugging
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('🔍 Session token exists:', !!sessionData.session?.access_token);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('question-media')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('❌ Upload error details:', uploadError);
          console.error('❌ Upload error message:', uploadError.message);
          console.error('❌ Upload error statusCode:', uploadError.statusCode);
          
          // Try to use preview URL as fallback for development
          if (previewUrl && selectedFile.type.startsWith('image/')) {
            console.log('⚠️ Using local preview URL as fallback for image');
            mediaUrl = previewUrl;
          } else {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }
        } else {
          console.log('✅ Upload successful! Upload data:', uploadData);
          
          const { data: urlData } = supabase.storage
            .from('question-media')
            .getPublicUrl(filePath);
          
          mediaUrl = urlData.publicUrl;
          console.log('✅ File uploaded successfully, URL:', mediaUrl);
        }
      }

      // 4. Insert question data into the database
      const correctOption = options.find(opt => opt.isCorrect);
      const correct_answer_char = correctOption ? String.fromCharCode(65 + options.indexOf(correctOption)) : null;

      if (!correct_answer_char) {
        throw new Error('Please select a correct option for the question.');
      }

      const optionsObject = options.reduce((acc, opt, idx) => {
        acc[String.fromCharCode(65 + idx)] = opt.text;
        return acc;
      }, {} as Record<string, string>);

      const query = isAdmin
        ? supabase.rpc('create_question_admin', {
            p_quiz_id: quizId,
            p_question_text: questionName,
            p_options: optionsObject,
            p_correct_answer: correct_answer_char,
            p_explanation: explanation,
            p_points: points,
            p_difficulty: difficulty,
            p_media_url: mediaUrl,
          })
        : supabase.from('questions').insert({
            quiz_id: quizId,
            question_text: questionName,
            difficulty: difficulty,
            points: points,
            media_url: mediaUrl,
            correct_answer: correct_answer_char,
            explanation: explanation,
            option_a: options[0].text,
            option_b: options[1].text,
            option_c: options[2].text,
            option_d: options[3].text,
          });

      const { error: questionError } = await query;

      if (questionError) {
        console.error('Question creation error:', questionError);
        if (questionError.message.includes('new row violates row-level security policy')) {
          throw new Error('Permission denied. You can only create questions for quizzes you own.');
        }
        throw questionError;
      }

      // Success - reset form and close dialog
      setQuestionName('');
      setDifficulty('easy');
      setPoints(2);
      setOptions([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
      setSelectedFile(null);
      setYoutubeUrl('');
      setExplanation('');
      setError(null);
      setFileSelected(false);
      setPreviewUrl(null);

      onQuestionCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating question:', err);
      
      // Provide more specific error messages
      let errorMessage = 'An unexpected error occurred.';
      
      if (err.message) {
        if (err.message.includes('row-level security policy')) {
          errorMessage = 'You do not have permission to create questions for this quiz. Please check if you are the owner of this quiz.';
        } else if (err.message.includes('Storage')) {
          errorMessage = `File upload failed: ${err.message}`;
        } else if (err.message.includes('duplicate key')) {
          errorMessage = 'A question with similar content already exists.';
        } else if (err.message.includes('File type not supported')) {
          errorMessage = err.message;
        } else if (err.message.includes('File size too large')) {
          errorMessage = err.message;
        } else if (err.message.includes('Authentication failed')) {
          errorMessage = err.message;
        } else if (err.message.includes('Permission denied')) {
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      } else if (err.code) {
        switch (err.code) {
          case '23505':
            errorMessage = 'A question with similar content already exists.';
            break;
          case '42501':
            errorMessage = 'You do not have permission to create questions for this quiz.';
            break;
          default:
            errorMessage = `Database error (${err.code}): ${err.message || 'Unknown error'}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
      // DEBUG: Log media upload status
      console.log('Media upload state:', uploading);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Question</DialogTitle>
          <DialogDescription>
            Enter the name, options, and details for your new question.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Question Name
              </Label>
              <Input id="name" value={questionName} onChange={(e) => setQuestionName(e.target.value)} className="col-span-3" required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="media" className="text-right">
                Image/Audio
              </Label>
              <Input id="media" type="file" onChange={handleFileChange} className="col-span-3" accept="image/*,audio/*" />
            </div>

            {/* Preview selected image */}
            {previewUrl && (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-right">
                  <Label>Preview</Label>
                </div>
                <div className="col-span-3">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full h-32 object-contain border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedFile?.name} ({((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              </div>
            )}

            {!fileSelected && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="youtube" className="text-right">
                  YouTube URL
                </Label>
                <Input id="youtube" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="col-span-3" placeholder="e.g., https://www.youtube.com/watch?v=..." />
              </div>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="explanation" className="text-right pt-2">
                Explanation
              </Label>
              <Textarea id="explanation" value={explanation} onChange={(e) => setExplanation(e.target.value)} className="col-span-3" placeholder="Explain why the correct answer is right..." />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Difficulty
              </Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy (2 pts)</SelectItem>
                  <SelectItem value="medium">Medium (3 pts)</SelectItem>
                  <SelectItem value="hard">Hard (5 pts)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="points" className="text-right">
                Points
              </Label>
              <Input id="points" type="number" value={points} className="col-span-3" readOnly />
            </div>

            <div className="mt-4">
              <Label>Options</Label>
              <div className="grid gap-2 mt-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                    <input
                      type="radio"
                      name="correct-option"
                      checked={option.isCorrect}
                      onChange={() => handleCorrectOptionChange(index)}
                      className="form-radio h-5 w-5 text-indigo-600"
                    />
                    <Label>Correct</Label>
                  </div>
                ))}
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuestionForm;
