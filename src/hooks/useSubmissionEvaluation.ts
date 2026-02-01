import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubmissionEvaluation {
  id: string;
  submission_id: string;
  follows_instructions: boolean;
  instruction_score: number;
  answer_correctness: number;
  strengths: string[];
  improvements: string[];
  detailed_feedback: string | null;
  suggested_score: number | null;
  evaluated_at: string;
  evaluated_by: string | null;
}

export const useSubmissionEvaluation = () => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluateSubmission = useCallback(async (submissionId: string): Promise<SubmissionEvaluation | null> => {
    setIsEvaluating(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-submission`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ submissionId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to evaluate submission');
      }

      const result = await response.json();
      return result.evaluation;
    } catch (err) {
      console.error('Evaluation error:', err);
      const message = err instanceof Error ? err.message : 'Failed to evaluate submission';
      setError(message);
      return null;
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  const fetchEvaluation = useCallback(async (submissionId: string): Promise<SubmissionEvaluation | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('submission_evaluations')
        .select('*')
        .eq('submission_id', submissionId)
        .maybeSingle();

      if (fetchError) {
        console.error('Fetch evaluation error:', fetchError);
        return null;
      }

      return data as SubmissionEvaluation | null;
    } catch (err) {
      console.error('Fetch evaluation error:', err);
      return null;
    }
  }, []);

  return {
    evaluateSubmission,
    fetchEvaluation,
    isEvaluating,
    error,
  };
};
