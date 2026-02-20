
-- Create a secure function that returns quiz questions WITHOUT correct_answer for students
CREATE OR REPLACE FUNCTION public.get_student_quiz_questions(_quiz_id uuid)
RETURNS TABLE (
  id uuid,
  quiz_id uuid,
  question text,
  options jsonb,
  points integer,
  question_order integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT qq.id, qq.quiz_id, qq.question, qq.options, qq.points, qq.question_order
  FROM public.quiz_questions qq
  JOIN public.quizzes q ON q.id = qq.quiz_id
  WHERE qq.quiz_id = _quiz_id
    AND q.is_published = true
  ORDER BY qq.question_order;
$$;

-- Create a secure function to validate quiz answers server-side
CREATE OR REPLACE FUNCTION public.validate_quiz_answer(_question_id uuid, _selected_answer text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quiz_questions
    WHERE id = _question_id AND correct_answer = _selected_answer
  );
$$;

-- Drop the student SELECT policy on quiz_questions base table
DROP POLICY IF EXISTS "Students can view published quiz questions" ON public.quiz_questions;
