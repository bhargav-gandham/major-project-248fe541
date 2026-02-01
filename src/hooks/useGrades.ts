import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Grade {
  id: string;
  student_id: string;
  subject: string;
  semester: string;
  grade_letter: string;
  grade_points: number;
  credits: number;
  remarks: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  student_name?: string;
  student_email?: string;
}

export interface GradeInput {
  student_id: string;
  subject: string;
  semester: string;
  grade_letter: string;
  grade_points: number;
  credits: number;
  remarks?: string;
}

// Grade point mapping
export const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'D-': 0.7,
  'F': 0.0,
};

export const GRADE_LETTERS = Object.keys(GRADE_POINTS);

export const calculateGPA = (grades: Grade[]): number => {
  if (grades.length === 0) return 0;
  
  const totalPoints = grades.reduce((sum, g) => sum + (g.grade_points * g.credits), 0);
  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
  
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
};

export const getGPAStatus = (gpa: number): { label: string; color: string } => {
  if (gpa >= 3.7) return { label: "Dean's List", color: 'text-success' };
  if (gpa >= 3.0) return { label: 'Good Standing', color: 'text-primary' };
  if (gpa >= 2.0) return { label: 'Satisfactory', color: 'text-warning' };
  return { label: 'Academic Probation', color: 'text-destructive' };
};

export const useGrades = (studentId?: string) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase.from('grades').select('*');
      
      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      
      const { data: gradesData, error: gradesError } = await query.order('semester', { ascending: false });
      
      if (gradesError) throw gradesError;

      // Fetch student profiles if viewing all grades (faculty view)
      if (!studentId && gradesData && gradesData.length > 0) {
        const studentIds = [...new Set(gradesData.map(g => g.student_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', studentIds);

        const profileMap: Record<string, { full_name: string; email: string }> = {};
        profiles?.forEach(p => {
          profileMap[p.user_id] = { full_name: p.full_name, email: p.email };
        });

        const enrichedGrades = gradesData.map(g => ({
          ...g,
          student_name: profileMap[g.student_id]?.full_name || g.student_id,
          student_email: profileMap[g.student_id]?.email || '',
        }));
        
        setGrades(enrichedGrades);
      } else {
        setGrades(gradesData || []);
      }
    } catch (err: any) {
      console.error('Error fetching grades:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  const addGrade = async (grade: GradeInput) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('grades')
      .insert({
        ...grade,
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchGrades();
    return data;
  };

  const updateGrade = async (id: string, updates: Partial<GradeInput>) => {
    const { error } = await supabase
      .from('grades')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await fetchGrades();
  };

  const deleteGrade = async (id: string) => {
    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchGrades();
  };

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const gpa = calculateGPA(grades);
  const gpaStatus = getGPAStatus(gpa);

  return {
    grades,
    isLoading,
    error,
    gpa,
    gpaStatus,
    fetchGrades,
    addGrade,
    updateGrade,
    deleteGrade,
  };
};
