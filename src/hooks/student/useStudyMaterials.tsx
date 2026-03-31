import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { studentQueryKeys } from './queryKeys';

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty: string;
  estimated_time: number;
  status: 'not_started' | 'in_progress' | 'completed';
  rating: number;
  content_url?: string;
}

async function fetchStudyMaterials(): Promise<StudyMaterial[]> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_study_materials_with_status');

  if (!rpcError && rpcData) {
    return (rpcData as any[]).map((material) => ({
      ...material,
      rating: material.rating ? Number(material.rating) : 0,
      status: material.status || (material.is_completed ? 'completed' : 'not_started'),
      estimated_time: Number(material.estimated_time || 0),
    }));
  }

  const { data: directData, error: directError } = await supabase
    .from('study_materials')
    .select('id, title, description, type, category, difficulty, estimated_time, rating, created_at')
    .order('created_at', { ascending: false });

  if (directError) {
    throw new Error(directError.message);
  }

  return (directData || []).map((material) => ({
    ...material,
    type: material.type || 'article',
    status: 'not_started',
    rating: material.rating ? Number(material.rating) : 0,
    estimated_time: Number(material.estimated_time || 0),
  })) as StudyMaterial[];
}

export function useStudyMaterials() {
  return useQuery<StudyMaterial[], Error>({
    queryKey: studentQueryKeys.studyMaterials(),
    queryFn: fetchStudyMaterials,
    staleTime: 60 * 1000,
  });
}
