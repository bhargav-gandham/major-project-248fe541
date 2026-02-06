
-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER DEFAULT 15,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  score INTEGER,
  total_points INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_answers table
CREATE TABLE public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Quizzes policies
CREATE POLICY "Faculty can create quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Faculty can update their quizzes" ON public.quizzes
  FOR UPDATE USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Faculty can delete their quizzes" ON public.quizzes
  FOR DELETE USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Faculty can view all quizzes" ON public.quizzes
  FOR SELECT USING (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view published quizzes" ON public.quizzes
  FOR SELECT USING (is_published = true AND has_role(auth.uid(), 'student'::app_role));

-- Quiz questions policies
CREATE POLICY "Faculty can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id
    AND (q.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Students can view published quiz questions" ON public.quiz_questions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id AND q.is_published = true
  ) AND has_role(auth.uid(), 'student'::app_role));

-- Quiz attempts policies
CREATE POLICY "Students can create attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid() AND has_role(auth.uid(), 'student'::app_role));

CREATE POLICY "Students can view own attempts" ON public.quiz_attempts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can update own attempts" ON public.quiz_attempts
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Faculty can view all attempts" ON public.quiz_attempts
  FOR SELECT USING (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Quiz answers policies
CREATE POLICY "Students can create answers" ON public.quiz_answers
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.quiz_attempts a WHERE a.id = quiz_answers.attempt_id AND a.student_id = auth.uid()
  ));

CREATE POLICY "Students can view own answers" ON public.quiz_answers
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.quiz_attempts a WHERE a.id = quiz_answers.attempt_id AND a.student_id = auth.uid()
  ));

CREATE POLICY "Faculty can view all answers" ON public.quiz_answers
  FOR SELECT USING (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add indexes
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);

-- Add trigger for updated_at
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
