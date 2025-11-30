import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Clock, Star, Video, Headphones, FileText, BookOpen, AlertCircle } from 'lucide-react';

interface MaterialViewerProps {
  materialId: string;
  onBack: () => void;
}

interface MaterialDetails {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty: string;
  estimated_time: number;
  rating: number;
  content_url?: string;
  storage_path?: string;

  is_completed: boolean;
}

export function MaterialViewer({ materialId, onBack }: MaterialViewerProps) {
  const { toast } = useToast();
  const [material, setMaterial] = useState<MaterialDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      if (!materialId) return;
      try {
        setLoading(true);
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .rpc('get_study_material_details', { p_material_id: materialId })
          .single(); // Use .single() as we expect one row

        if (error) throw error;

        if (data) {
          setMaterial(data as MaterialDetails);
        } else {
          setError('Material not found.');
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching material:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId]);

  const handleMarkAsComplete = async () => {
    if (!materialId || !material) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('user_material_status').upsert({
        user_id: user.id,
        material_id: materialId,
        is_completed: true,
        status: 'completed',
      }, {
        onConflict: 'user_id,material_id',
      });

      if (error) throw error;

      setMaterial({ ...material, is_completed: true });
      toast({
        title: 'Congratulations!',
        description: 'You have completed this material.',
        className: 'bg-green-100 text-green-800',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: `Failed to mark as complete: ${err.message}`,
        variant: 'destructive',
      });
    }
  };

  const AudioPlayer = ({ storagePath }: { storagePath: string }) => {
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const getAudioUrl = async () => {
        try {
          const { data, error } = await supabase.storage
            .from('study-materials')
            .createSignedUrl(storagePath, 3600); // 1 hour expiry for audio
          
          if (error) {
            console.error('Error creating signed URL for audio:', error);
            setLoading(false);
            return;
          }
          
          if (data?.signedUrl) {
            setAudioUrl(data.signedUrl);
          }
        } catch (err) {
          console.error('Error getting audio URL:', err);
        } finally {
          setLoading(false);
        }
      };
      
      getAudioUrl();
    }, [storagePath]);

    if (loading) return <p>Loading audio...</p>;
    if (!audioUrl) return <p>Audio file not available.</p>;
    
    return <audio controls src={audioUrl} className="w-full">Your browser does not support the audio element.</audio>;
  };

  const renderContent = () => {
    if (!material) return null;

    switch (material.type) {
      case 'video':
        return (
            <iframe
              src={material.content_url ? `https://www.youtube.com/embed/${material.content_url.split('v=')[1]?.split('&')[0]}` : ''}
              title={material.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full aspect-video rounded-b-lg"
            ></iframe>
        );
      case 'audio':
        // Check if it's a Google Drive link or an uploaded audio file
        if (material.content_url && material.content_url.includes('drive.google.com')) {
          const googleDriveFileId = material.content_url?.match(/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
          if (googleDriveFileId) {
            return (
              <iframe
                src={`https://docs.google.com/embed/d/${googleDriveFileId}`}
                width="100%"
                height="300"
                frameBorder="0"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            );
          } else {
            return <p>Invalid Google Drive audio link.</p>;
          }
        } else if (material.storage_path) {
          return <AudioPlayer storagePath={material.storage_path} />;
        }
        return <p>Audio file not available.</p>;
      case 'pdf':
      case 'ppt':
        if (material.storage_path) {
          // Gunakan createSignedUrl untuk authenticated access
          const handleDownload = async () => {
            try {
              const { data, error } = await supabase.storage
                .from('study-materials')
                .createSignedUrl(material.storage_path!, 60); // 60 seconds expiry
              
              if (error) {
                console.error('Error creating signed URL:', error);
                toast({
                  title: 'Error',
                  description: 'Failed to access file. Please try again.',
                  variant: 'destructive',
                });
                return;
              }
              
              if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
              }
            } catch (err) {
              console.error('Error downloading file:', err);
              toast({
                title: 'Error',
                description: 'Failed to download file. Please try again.',
                variant: 'destructive',
              });
            }
          };

          return (
            <Button 
              onClick={handleDownload}
              className="text-blue-600 hover:text-blue-800"
              variant="link"
            >
              Download or view {material.type.toUpperCase()}
            </Button>
          );
        }
        return <p>File not available.</p>;
      case 'article':
      case 'interactive':
        return <p>Content not available. Please refer to the URL.</p>;

      default:
        return <p>Unsupported material type.</p>;
    }
  };

  if (loading) return <div className="text-center p-10">Loading material...</div>;
  if (error) return <div className="text-center p-10 text-red-600 flex items-center justify-center"><AlertCircle className='mr-2' />Error: {error}</div>;
  if (!material) return <div className="text-center p-10">Material not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <button onClick={onBack} className="flex items-center text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to all materials
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{material.title}</CardTitle>
          <CardDescription className="text-lg pt-2">{material.description}</CardDescription>
          <div className="flex items-center flex-wrap gap-4 pt-4 text-sm text-gray-600">
            <Badge variant="outline">{material.category}</Badge>
            <Badge variant="secondary">{material.difficulty}</Badge>
            <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {material.estimated_time} min</div>
            <div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400" /> {material.rating}</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {material.type === 'video' ? (
            renderContent()
          ) : (
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                {renderContent()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={handleMarkAsComplete} 
          disabled={material.is_completed}
          size="lg"
          className={material.is_completed ? 'bg-green-600' : ''}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          {material.is_completed ? 'Completed!' : 'Mark as Complete'}
        </Button>
      </div>
    </div>
  );
}
