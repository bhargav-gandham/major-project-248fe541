-- Create plagiarism reports table
CREATE TABLE public.plagiarism_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    similarity_percentage INTEGER NOT NULL DEFAULT 0,
    is_flagged BOOLEAN NOT NULL DEFAULT false,
    matched_submissions JSONB DEFAULT '[]'::jsonb,
    analysis_details TEXT,
    analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    analyzed_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.plagiarism_reports ENABLE ROW LEVEL SECURITY;

-- Only faculty and admin can view plagiarism reports
CREATE POLICY "Faculty can view plagiarism reports"
ON public.plagiarism_reports
FOR SELECT
USING (has_role(auth.uid(), 'faculty') OR has_role(auth.uid(), 'admin'));

-- Only faculty and admin can create plagiarism reports (via edge function)
CREATE POLICY "Faculty can create plagiarism reports"
ON public.plagiarism_reports
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'faculty') OR has_role(auth.uid(), 'admin'));

-- Faculty can update reports they created
CREATE POLICY "Faculty can update plagiarism reports"
ON public.plagiarism_reports
FOR UPDATE
USING (has_role(auth.uid(), 'faculty') OR has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_plagiarism_reports_submission ON public.plagiarism_reports(submission_id);