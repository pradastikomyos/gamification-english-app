import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MaterialForm, MaterialFormValues } from './MaterialForm';

// This interface should match the columns in your 'study_materials' table
interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'audio' | 'pdf' | 'ppt' | 'article';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: number;
  url: string | null;
  storage_path: string | null;
  content: string | null;
  created_at: string;
  teacher_id: string;
}

import { MaterialViewer } from '@/components/student/MaterialViewer';

export default function MaterialManagement() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialFormValues | null>(null);
  const [viewingMaterialId, setViewingMaterialId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setMaterials(data as StudyMaterial[]);
      }
    } catch (error: any) {
      toast({
        title: 'Error fetching materials',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleAddNew = () => {
    setEditingMaterial(null);
    setIsFormOpen(true);
  };

  const handleEdit = (material: StudyMaterial) => {
    const formValues: MaterialFormValues = {
      id: material.id,
      title: material.title,
      description: material.description,
      type: material.type,
      category: material.category,
      difficulty: material.difficulty,
      estimated_time: material.estimated_time, // Keep as number, Zod will coerce form value
      url: material.url ?? undefined,
      content: material.content ?? undefined,
      storage_path: material.storage_path ?? undefined,
      file: undefined, // 'file' is only for uploads, not for existing data
    };
    setEditingMaterial(formValues);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    setIsFormOpen(false);
    setEditingMaterial(null);
    fetchMaterials(); // This will also set loading to true
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabase.from('study_materials').delete().eq('id', id);
        if (error) throw error;
        setMaterials(materials.filter(m => m.id !== id));
        toast({
            title: 'Success',
            description: 'Material deleted successfully.'
        });
    } catch (error: any) {
        toast({
            title: 'Error deleting material',
            description: error.message,
            variant: 'destructive',
        });
    }
  };

  if (viewingMaterialId) {
    return <MaterialViewer materialId={viewingMaterialId} onBack={() => setViewingMaterialId(null)} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Material Management</CardTitle>
            <CardDescription>Add, edit, or delete your study materials.</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Material
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Difficulty</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length > 0 ? (
                materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => setViewingMaterialId(material.id)}
                        className="text-blue-600 hover:underline text-left"
                      >
                        {material.title}
                      </button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{material.type}</TableCell>
                    <TableCell className="hidden md:table-cell">{material.category}</TableCell>
                    <TableCell className="hidden lg:table-cell">{material.difficulty}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(material)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(material.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    You haven't created any materials yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <MaterialForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        initialData={editingMaterial}
      />
    </Card>
  );
}
