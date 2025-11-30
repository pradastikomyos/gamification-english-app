import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  PlayCircle,
  FileText,
  Video,
  Headphones,
  Download,
  Search,
  Star,
  Clock,
  CheckCircle,
  Globe,
  MessageCircle,
  Briefcase,
  GraduationCap,
  Zap,
  Target
} from 'lucide-react';

interface StudyMaterialsProps {
  onStartMaterial: (materialId: string) => void;
}

interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty: string;
  estimated_time: number; // in minutes
  status: 'not_started' | 'in_progress' | 'completed';
  rating: number;
  content_url?: string;

}

export function StudyMaterials({ onStartMaterial }: StudyMaterialsProps) {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<StudyMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudyMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchTerm, selectedCategory, selectedDifficulty]);

  const loadStudyMaterials = async () => {
    try {
      setLoading(true);
      console.log('Loading study materials...');
      
      // Try RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_study_materials_with_status');

      console.log('RPC Response:', { data: rpcData, error: rpcError });

      if (rpcError) {
        console.log('RPC failed, trying direct query...');
        
        // Fallback to direct query
        const { data: directData, error: directError } = await supabase
          .from('study_materials')
          .select('id, title, description, type, category, difficulty, estimated_time, rating, created_at')
          .order('created_at', { ascending: false });

        console.log('Direct query response:', { data: directData, error: directError });

        if (directError) {
          throw directError;
        }

        if (directData) {
          // Transform data to match expected format
          const transformedData = directData.map(m => ({
            ...m,
            type: m.type || 'article',
            status: 'not_started' as const,
            rating: m.rating ? Number(m.rating) : 0
          }));
          console.log('Transformed materials:', transformedData);
          setMaterials(transformedData);
        } else {
          setMaterials([]);
        }
      } else if (rpcData) {
        // RPC succeeded
        const materialsWithParsedRating = rpcData.map(m => ({
          ...m, 
          rating: m.rating ? Number(m.rating) : 0,
          status: m.status || (m.is_completed ? 'completed' : 'not_started')
        }));
        console.log('Processed materials:', materialsWithParsedRating);
        setMaterials(materialsWithParsedRating);
      } else {
        console.log('No data returned from RPC');
        setMaterials([]);
      }

    } catch (error: any) {
      console.error('Error loading materials:', error);
      toast({
        title: 'Error',
        description: `Failed to load study materials: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = materials;

    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(material => material.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(material => material.difficulty === selectedDifficulty);
    }

    setFilteredMaterials(filtered);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'audio':
        return <Headphones className="h-5 w-5" />;
      case 'quiz':
        return <Target className="h-5 w-5" />;
      case 'interactive':
        return <PlayCircle className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grammar':
        return <BookOpen className="h-4 w-4" />;
      case 'vocabulary':
        return <Globe className="h-4 w-4" />;
      case 'conversation':
        return <MessageCircle className="h-4 w-4" />;
      case 'business':
        return <Briefcase className="h-4 w-4" />;
      case 'pronunciation':
        return <Headphones className="h-4 w-4" />;
      default:
        return <GraduationCap className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <Zap className="h-3 w-3" />;
      case 'intermediate':
        return <Target className="h-3 w-3" />;
      case 'advanced':
        return <Star className="h-3 w-3" />;
      default:
        return <BookOpen className="h-3 w-3" />;
    }
  };

  const handleStartMaterial = (material: StudyMaterial) => {
    onStartMaterial(material.id);
  };

  const completedCount = materials.filter(m => m.status === 'completed').length;
  const completionPercentage = materials.length > 0 ? (completedCount / materials.length) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loading study materials...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📚 Study Materials</h1>
          <p className="text-gray-600">Improve your English with curated learning resources</p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Your Progress</h3>
            <Badge className="bg-green-100 text-green-800">
              {completedCount}/{materials.length} completed
            </Badge>
          </div>
          <Progress value={completionPercentage} className="h-3 mb-2" />
          <p className="text-sm text-gray-600">
            {Math.round(completionPercentage)}% of materials completed
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="grammar">Grammar</option>
              <option value="vocabulary">Vocabulary</option>
              <option value="conversation">Conversation</option>
              <option value="business">Business</option>
              <option value="pronunciation">Pronunciation</option>
              {/* Dynamic categories from materials */}
              {[...new Set(materials.map(m => m.category))]
                .filter(cat => !['grammar', 'vocabulary', 'conversation', 'business', 'pronunciation'].includes(cat))
                .map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))
              }
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No materials found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredMaterials.map((material) => (
            <Card key={material.id} className={`transition-all hover:shadow-lg ${
              material.status === 'completed' ? 'ring-2 ring-green-200 bg-green-50' : ''
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getTypeIcon(material.type)}
                    </div>
                    <Badge className={getDifficultyColor(material.difficulty)}>
                      {getDifficultyIcon(material.difficulty)}
                      {material.difficulty}
                    </Badge>
                  </div>
                  {material.status === 'completed' && (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-4 line-clamp-3">
                  {material.description}
                </CardDescription>
                
                <div className="space-y-3">
                  {/* Category & Time */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {getCategoryIcon(material.category)}
                      <span className="capitalize">{material.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{material.estimated_time} min</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(material.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({material.rating})</span>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleStartMaterial(material)}
                    className="w-full"
                    variant={material.status === 'completed' ? "outline" : "default"}
                  >
                    {material.status === 'completed' ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Review
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Learning
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
