-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Students can view their submissions" ON public.submissions;

-- Create a permissive SELECT policy instead
CREATE POLICY "Users can view relevant submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid() 
  OR has_role(auth.uid(), 'faculty'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);