import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Plus, BookOpen, Edit, Trash2, Loader2, User, Link as LinkIcon } from 'lucide-react';

// Interface untuk objek Materi dari perspektif Admin
interface Material {
  id: string;
  title: string;
  description: string;
  content_url: string;
  created_at: string;
  teacher_name: string | null; // Nama guru yang membuat
}

// State untuk form materi
interface MaterialFormState {
  title: string;
  description: string;
  content_url: string;
}

export default function AdminMaterialManagement() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // State untuk form dan aksi
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [materialForm, setMaterialForm] = useState<MaterialFormState>({ title: '', description: '', content_url: '' });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      // Try to use admin RPC first
      const { data: adminData, error: adminError } = await supabase.rpc('get_all_materials_admin');
      
      if (!adminError && adminData) {
        const materialsWithData = adminData.map((material: any): Material => ({
          id: material.id,
          title: material.title,
          description: material.description,
          content_url: material.content_url,
          created_at: material.created_at,
          teacher_name: material.teacher_name || 'N/A',
        }));
        setMaterials(materialsWithData);
        return;
      }

      // Fallback to existing method
      const { data, error } = await supabase
        .from('materials')
        .select(`id, title, description, content_url, created_at, teacher:teachers(name)`);

      if (error) throw error;

      const materialsWithData = data.map((material: any): Material => ({
        ...material,
        teacher_name: material.teacher?.name || 'N/A',
      }));

      setMaterials(materialsWithData);
    } catch (error: any) {
      toast({
        title: 'Error Fetching Materials',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMaterialForm({ title: '', description: '', content_url: '' });
  };

  // --- Handler CRUD menggunakan RPC ---
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { title, description, content_url } = materialForm;
      const { data, error } = await supabase.rpc('create_material', {
        p_title: title,
        p_description: description,
        p_content_url: content_url
      });

      if (error) throw error;

      toast({ title: 'Success', description: `Material "${data.title}" created.` });
      setIsCreateDialogOpen(false);
      fetchMaterials(); // Refresh list
    } catch (error: any) {
      toast({ title: 'Creation Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMaterial) return;
    try {
      const { title, description, content_url } = materialForm;
      const { data, error } = await supabase.rpc('update_material', {
        p_material_id: currentMaterial.id,
        p_title: title,
        p_description: description,
        p_content_url: content_url
      });

      if (error) throw error;

      toast({ title: 'Success', description: `Material "${data.title}" updated.` });
      setIsEditDialogOpen(false);
      fetchMaterials(); // Refresh list
    } catch (error: any) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return;
    try {
      const { data, error } = await supabase.rpc('delete_material', { p_material_id: materialToDelete.id });
      if (error) throw error;

      toast({ title: 'Success', description: `Material "${data.title}" deleted.` });
      setIsDeleteConfirmOpen(false);
      setMaterialToDelete(null);
      fetchMaterials(); // Refresh list
    } catch (error: any) {
      toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
    }
  };

  // --- Pembuka Dialog ---
  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (material: Material) => {
    setCurrentMaterial(material);
    setMaterialForm({ title: material.title, description: material.description, content_url: material.content_url });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (material: Material) => {
    setMaterialToDelete(material);
    setIsDeleteConfirmOpen(true);
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Materials...</p>
      </div>
    );
  }

  return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Material Management</h1>
            <p className="text-muted-foreground">Create, edit, and delete materials for all users.</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Material
          </Button>
        </div>

        {materials.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed rounded-lg mt-8">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No Materials Found</h2>
            <p className="mt-2 mb-6 text-muted-foreground">Get started by creating the first material.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-5 w-5" />
              Create a Material
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <Card key={material.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{material.title}</CardTitle>
                  <CardDescription className="h-10 line-clamp-2">{material.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                     <User className="h-4 w-4" />
                     <span>{material.teacher_name}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                   <a href={material.content_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm"><LinkIcon className="mr-2 h-4 w-4"/>View Content</Button>
                   </a>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(material)}><Edit className="h-4 w-4"/></Button>
                    <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(material)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={materialForm.title} onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={materialForm.description} onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })} />
              </div>
               <div>
                <Label htmlFor="content_url">Content URL</Label>
                <Input id="content_url" value={materialForm.content_url} onChange={(e) => setMaterialForm({ ...materialForm, content_url: e.target.value })} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Material</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditMaterial} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" value={materialForm.title} onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={materialForm.description} onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-content_url">Content URL</Label>
                <Input id="edit-content_url" value={materialForm.content_url} onChange={(e) => setMaterialForm({ ...materialForm, content_url: e.target.value })} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Update Material</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the material "{materialToDelete?.title}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteMaterial}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </div>
  );
}
