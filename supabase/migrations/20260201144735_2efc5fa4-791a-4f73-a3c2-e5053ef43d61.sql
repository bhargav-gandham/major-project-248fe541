-- Create parent_student_links table for parent-student relationships
CREATE TABLE public.parent_student_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid NOT NULL,
    student_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    UNIQUE(parent_id, student_id)
);

-- Enable RLS
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- Parents can view their own links
CREATE POLICY "Parents can view their student links"
ON public.parent_student_links
FOR SELECT
USING (parent_id = auth.uid());

-- Admins can view all links
CREATE POLICY "Admins can view all parent student links"
ON public.parent_student_links
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create links
CREATE POLICY "Admins can create parent student links"
ON public.parent_student_links
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete links
CREATE POLICY "Admins can delete parent student links"
ON public.parent_student_links
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update grades policy so parents can see their linked student's grades
CREATE POLICY "Parents can view linked student grades"
ON public.grades
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.parent_student_links psl
        WHERE psl.parent_id = auth.uid()
        AND psl.student_id = grades.student_id
    )
);

-- Allow parents to view submissions of their linked students
CREATE POLICY "Parents can view linked student submissions"
ON public.submissions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.parent_student_links psl
        WHERE psl.parent_id = auth.uid()
        AND psl.student_id = submissions.student_id
    )
);

-- Allow parents to view profiles of their linked students
CREATE POLICY "Parents can view linked student profiles"
ON public.profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.parent_student_links psl
        WHERE psl.parent_id = auth.uid()
        AND psl.student_id = profiles.user_id
    )
);