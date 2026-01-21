import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  due_date: string;
  max_score: number;
  created_by: string;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  typed_content: string | null;
  file_url: string | null;
  submitted_at: string;
  score: number | null;
  feedback: string | null;
  is_late: boolean;
  student_name?: string;
  student_email?: string;
}

export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createAssignment = async (assignment: Omit<Assignment, 'id' | 'created_at' | 'created_by'>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        ...assignment,
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchAssignments();
    return data;
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchAssignments();
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return { assignments, isLoading, error, fetchAssignments, createAssignment, deleteAssignment };
};

export const useSubmissions = (assignmentId?: string) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch submissions
      let query = supabase.from('submissions').select('*');
      
      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }

      const { data: submissionsData, error: submissionsError } = await query.order('submitted_at', { ascending: false });
      if (submissionsError) throw submissionsError;

      // Fetch profiles for student names
      const studentIds = [...new Set((submissionsData || []).map(s => s.student_id))];
      
      let profilesMap: Record<string, { full_name: string; email: string }> = {};
      if (studentIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', studentIds);
        
        if (profilesData) {
          profilesData.forEach(p => {
            profilesMap[p.user_id] = { full_name: p.full_name, email: p.email };
          });
        }
      }

      // Merge submissions with student info
      const enrichedSubmissions = (submissionsData || []).map(sub => ({
        ...sub,
        student_name: profilesMap[sub.student_id]?.full_name || 'Unknown Student',
        student_email: profilesMap[sub.student_id]?.email || '',
      }));

      setSubmissions(enrichedSubmissions);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      setError(err?.message || 'Failed to fetch submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMySubmission = async (assignmentId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', userData.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching my submission:', error);
      return null;
    }
    
    setMySubmission(data);
    return data;
  };

  const submitAssignment = async (
    assignmentId: string,
    typedContent: string,
    fileUrl?: string,
    isLate?: boolean
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: userData.user.id,
        typed_content: typedContent,
        file_url: fileUrl || null,
        is_late: isLate || false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const gradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('submissions')
      .update({
        score,
        feedback,
        graded_at: new Date().toISOString(),
        graded_by: userData.user.id,
      })
      .eq('id', submissionId);

    if (error) throw error;
    await fetchSubmissions();
  };

  useEffect(() => {
    fetchSubmissions();
  }, [assignmentId]);

  return { 
    submissions, 
    mySubmission, 
    isLoading, 
    error,
    fetchSubmissions, 
    fetchMySubmission, 
    submitAssignment, 
    gradeSubmission 
  };
};
