import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Class {
  id: string;
  name: string;
  teacher_id: string | null;
  created_at: string;
  teacher_name: string;
}

const fetchClasses = async (): Promise<Class[]> => {
  const { data, error } = await supabase.rpc('admin_get_all_classes');
  if (error) throw new Error(error.message);
  return data || [];
};

export const useClasses = () => {
  return useQuery<Class[], Error>({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  });
};
