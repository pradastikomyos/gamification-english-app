import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const StorageDebugger = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setResult('');

    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Test file upload
      const fileExt = file.name.split('.').pop();
      const fileName = `test-${Date.now()}.${fileExt}`;
      
      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);

      const { data, error: uploadError } = await supabase.storage
        .from('question-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload success:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('question-media')
        .getPublicUrl(fileName);

      setResult(`Upload successful! Path: ${data.path}, URL: ${urlData.publicUrl}`);

    } catch (err: any) {
      console.error('Test upload error:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Storage Upload Test</h3>
      
      <div>
        <Input
          type="file"
          accept="image/*,audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <Button 
        onClick={testUpload} 
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Test Upload'}
      </Button>

      {result && (
        <Alert>
          <AlertDescription className="text-green-600">
            {result}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert>
          <AlertDescription className="text-red-600">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
