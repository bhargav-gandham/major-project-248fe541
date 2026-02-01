-- Create table for AI-powered submission evaluations
CREATE TABLE public.submission_evaluations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    follows_instructions BOOLEAN NOT NULL DEFAULT false,
    instruction_score INTEGER NOT NULL DEFAULT 0,
    answer_correctness INTEGER NOT NULL DEFAULT 0,
    strengths TEXT[] DEFAULT '{}',
    improvements TEXT[] DEFAULT '{}',
    detailed_feedback TEXT,
    suggested_score INTEGER,
    evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    evaluated_by UUID,
    UNIQUE(submission_id)
);

-- Enable RLS
ALTER TABLE public.submission_evaluations ENABLE ROW LEVEL SECURITY;

-- Faculty and admins can view evaluations
CREATE POLICY "Faculty can view evaluations"
ON public.submission_evaluations
FOR SELECT
USING (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Faculty and admins can create evaluations
CREATE POLICY "Faculty can create evaluations"
ON public.submission_evaluations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Faculty and admins can update evaluations
CREATE POLICY "Faculty can update evaluations"
ON public.submission_evaluations
FOR UPDATE
USING (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Faculty and admins can delete evaluations
CREATE POLICY "Faculty can delete evaluations"
ON public.submission_evaluations
FOR DELETE
USING (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Students can view their own evaluations
CREATE POLICY "Students can view own evaluations"
ON public.submission_evaluations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.id = submission_id AND s.student_id = auth.uid()
    )
);