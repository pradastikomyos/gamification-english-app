import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogHeader } from '@/components/ui/dialog'; // Keep DialogHeader import if it's used elsewhere or for styling
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { FileText, UploadCloud, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface Quiz {
  id: string;
  title: string;
  description: string;
  created_at: string;
  questionCount?: number;
}

interface QuizFileUploadDialogProps {
  onQuizCreated: (newQuiz: Quiz) => void;
}

export function QuizFileUploadDialog({ onQuizCreated }: QuizFileUploadDialogProps) {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const dialogTitleId = React.useId();
  const dialogDescriptionId = React.useId();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setSelectedFile(file);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a PDF or DOCX file.',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setSelectedFile(file);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a PDF or DOCX file.',
          variant: 'destructive',
        });
        setSelectedFile(null); // Clear selection if invalid
      }
    }
  };

  const handleCreateQuizFromFile = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF or DOCX file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // 1. Upload file to Supabase Storage
      const filePath = `quiz_uploads/${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('quiz_files') // Ensure this bucket exists in your Supabase project
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase Storage Upload Error:', uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // 2. Call Supabase Edge Function to process the file
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-quiz-from-file', {
        body: JSON.stringify({ filePath: uploadData.path }),
      });

      if (functionError) {
        console.error('Supabase Function Invoke Error:', functionError);
        throw new Error(`Quiz generation failed: ${functionError.message}`);
      }

      if (functionData.error) {
        console.error('Quiz Generation Error from Function:', functionData.error);
        throw new Error(`Quiz generation failed: ${functionData.error}`);
      }

      // The functionData is the new quiz object.
      // The parent component will show the toast.
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      onQuizCreated(functionData); // Pass the new quiz data to the parent
    } catch (error: any) {
      console.error('Error creating quiz from file:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate quiz from file.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" aria-labelledby={dialogTitleId} aria-describedby={dialogDescriptionId}>
        <DialogHeader> {/* Re-add DialogHeader for consistent styling if needed, but ensure direct children */}
          <DialogTitle id={dialogTitleId}>Generate Quiz from File</DialogTitle>
          <DialogDescription id={dialogDescriptionId}>
            Upload a PDF or DOCX file to automatically generate quiz questions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            {isDragActive ? (
              <p className="text-gray-600">Drop the files here ...</p>
            ) : (
              <p className="text-gray-600">Drag 'n' drop a PDF or DOCX file here, or click to select one</p>
            )}
            <p className="text-sm text-gray-500 mt-1">Max file size: 10MB</p>
          </div>
          {selectedFile && (
            <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                Remove
              </Button>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsUploadDialogOpen(false);
              setSelectedFile(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateQuizFromFile} disabled={!selectedFile || uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Quiz'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
