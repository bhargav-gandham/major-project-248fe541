-- Allow faculty to view all user roles (needed to list students)
CREATE POLICY "Faculty can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'faculty'::app_role));