import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceGap {
  subject: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}

export interface LearningRecommendation {
  subject: string;
  title: string;
  description: string;
  type: 'video' | 'practice' | 'reading' | 'tutorial' | 'exercise';
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
}

export interface LearningPathData {
  performanceGaps: PerformanceGap[];
  recommendations: LearningRecommendation[];
  encouragement?: string;
  message?: string;
  performanceSummary?: Array<{
    subject: string;
    assignmentAverage: number | null;
    assignmentCount: number;
    recentGrades: string[];
  }>;
}

export const useLearningPath = () => {
  const [data, setData] = useState<LearningPathData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLearningPath = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learning-path`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch learning path');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Learning path error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load learning path');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchLearningPath,
  };
};
