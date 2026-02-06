import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  subject: string;
  description: string | null;
  time_limit_minutes: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  points: number;
  question_order: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number | null;
  total_points: number | null;
  started_at: string;
  completed_at: string | null;
}

export const useQuizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes((data as Quiz[]) || []);
    } catch (error: any) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const createQuiz = async (
    quiz: { title: string; topic: string; subject: string; description?: string; time_limit_minutes?: number },
    questions: { question: string; options: string[]; correct_answer: string; points: number }[]
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        title: quiz.title,
        topic: quiz.topic,
        subject: quiz.subject,
        description: quiz.description || null,
        time_limit_minutes: quiz.time_limit_minutes || 15,
        is_published: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (quizError) throw quizError;

    const questionsToInsert = questions.map((q, index) => ({
      quiz_id: quizData.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      points: q.points || 1,
      question_order: index,
    }));

    const { error: qError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (qError) throw qError;

    await fetchQuizzes();
    return quizData;
  };

  const togglePublish = async (quizId: string, isPublished: boolean) => {
    const { error } = await supabase
      .from('quizzes')
      .update({ is_published: !isPublished })
      .eq('id', quizId);

    if (error) throw error;
    await fetchQuizzes();
  };

  const deleteQuiz = async (quizId: string) => {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (error) throw error;
    await fetchQuizzes();
  };

  return { quizzes, isLoading, fetchQuizzes, createQuiz, togglePublish, deleteQuiz };
};

export const useQuizQuestions = (quizId: string | null) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!quizId) return;

    const fetch = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('question_order');

        if (error) throw error;
        setQuestions((data as QuizQuestion[]) || []);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [quizId]);

  return { questions, isLoading };
};

export const useQuizAttempts = () => {
  const { user } = useAuth();

  const getMyAttempt = async (quizId: string): Promise<QuizAttempt | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching attempt:', error);
      return null;
    }
    return (data?.[0] as QuizAttempt) || null;
  };

  const startAttempt = async (quizId: string, totalPoints: number): Promise<QuizAttempt> => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: user.id,
        total_points: totalPoints,
      })
      .select()
      .single();

    if (error) throw error;
    return data as QuizAttempt;
  };

  const submitAttempt = async (
    attemptId: string,
    answers: { question_id: string; selected_answer: string; is_correct: boolean }[],
    score: number
  ) => {
    const { error: answersError } = await supabase
      .from('quiz_answers')
      .insert(answers.map(a => ({ ...a, attempt_id: attemptId })));

    if (answersError) throw answersError;

    const { error: updateError } = await supabase
      .from('quiz_attempts')
      .update({ score, completed_at: new Date().toISOString() })
      .eq('id', attemptId);

    if (updateError) throw updateError;
  };

  return { getMyAttempt, startAttempt, submitAttempt };
};
