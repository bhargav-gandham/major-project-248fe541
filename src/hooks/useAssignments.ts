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

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('submissions').select('*');
      
      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }

      const { data, error } = await query.order('submitted_at', { ascending: false });
      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
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
    fetchSubmissions, 
    fetchMySubmission, 
    submitAssignment, 
    gradeSubmission 
  };
};
