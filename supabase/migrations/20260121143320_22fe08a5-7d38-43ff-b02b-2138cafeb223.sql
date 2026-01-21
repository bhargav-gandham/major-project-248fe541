-- Allow faculty to view all profiles (needed to show student names)
CREATE POLICY "Faculty can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'faculty'::app_role));