-- Drop the existing INSERT policy that's too permissive
DROP POLICY IF EXISTS "Students can submit assignments" ON public.submissions;

-- Create a stricter INSERT policy - ONLY students can submit
CREATE POLICY "Only students can submit assignments"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'student'::app_role) 
  AND student_id = auth.uid()
);