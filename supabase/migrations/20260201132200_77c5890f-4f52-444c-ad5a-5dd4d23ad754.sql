-- Create grades table for storing final subject grades
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  subject TEXT NOT NULL,
  semester TEXT NOT NULL,
  grade_letter TEXT NOT NULL,
  grade_points DECIMAL(3,2) NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  remarks TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject, semester)
);

-- Enable RLS
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Students can view their own grades
CREATE POLICY "Students can view their own grades"
ON public.grades
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Faculty and admin can view all grades
CREATE POLICY "Faculty can view all grades"
ON public.grades
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Faculty and admin can insert grades
CREATE POLICY "Faculty can insert grades"
ON public.grades
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Faculty and admin can update grades
CREATE POLICY "Faculty can update grades"
ON public.grades
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Faculty and admin can delete grades
CREATE POLICY "Faculty can delete grades"
ON public.grades
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Parents can view their linked students' grades (for future parent-student linking)
CREATE POLICY "Parents can view grades"
ON public.grades
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'parent'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_grades_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();