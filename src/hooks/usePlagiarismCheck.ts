import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PlagiarismReport {
  id: string;
  submission_id: string;
  similarity_percentage: number;
  is_flagged: boolean;
  matched_submissions: string[];
  analysis_details: string;
  analyzed_at: string;
  analyzed_by: string | null;
}

export const usePlagiarismCheck = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const checkPlagiarism = async (submissionId: string): Promise<PlagiarismReport | null> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-plagiarism', {
        body: { submissionId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Analysis Complete',
        description: `Similarity: ${data.report.similarity_percentage}%${data.report.is_flagged ? ' - Flagged for review' : ''}`,
        variant: data.report.is_flagged ? 'destructive' : 'default',
      });

      return data.report;
    } catch (error: any) {
      console.error('Plagiarism check error:', error);
      
      let errorMessage = error.message || 'Failed to analyze submission';
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message?.includes('402')) {
        errorMessage = 'AI credits exhausted. Please add funds to continue.';
      }

      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getReport = async (submissionId: string): Promise<PlagiarismReport | null> => {
    try {
      const { data, error } = await supabase
        .from('plagiarism_reports')
        .select('*')
        .eq('submission_id', submissionId)
        .maybeSingle();

      if (error) throw error;
      return data as PlagiarismReport | null;
    } catch (error: any) {
      console.error('Failed to fetch report:', error);
      return null;
    }
  };

  const getAllReports = async (): Promise<PlagiarismReport[]> => {
    try {
      const { data, error } = await supabase
        .from('plagiarism_reports')
        .select('*')
        .order('analyzed_at', { ascending: false });

      if (error) throw error;
      return (data as PlagiarismReport[]) || [];
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      return [];
    }
  };

  return {
    checkPlagiarism,
    getReport,
    getAllReports,
    isAnalyzing,
  };
};
