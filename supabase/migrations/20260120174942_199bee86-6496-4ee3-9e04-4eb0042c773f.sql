-- Create assignments table
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    subject TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    typed_content TEXT,
    file_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    score INTEGER,
    feedback TEXT,
    is_late BOOLEAN DEFAULT false,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES auth.users(id),
    UNIQUE(assignment_id, student_id)
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Assignment policies
CREATE POLICY "Faculty can create assignments"
ON public.assignments FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty can update their assignments"
ON public.assignments FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty can delete their assignments"
ON public.assignments FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (true);

-- Submission policies
CREATE POLICY "Students can submit assignments"
ON public.submissions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'student') AND student_id = auth.uid());

CREATE POLICY "Students can view their submissions"
ON public.submissions FOR SELECT
TO authenticated
USING (
    student_id = auth.uid() OR 
    public.has_role(auth.uid(), 'faculty') OR 
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Faculty can grade submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for submission files
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false);

-- Storage policies for submissions bucket
CREATE POLICY "Students can upload submission files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'submissions' AND 
    public.has_role(auth.uid(), 'student') AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own submission files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'submissions' AND 
    (
        (storage.foldername(name))[1] = auth.uid()::text OR
        public.has_role(auth.uid(), 'faculty') OR
        public.has_role(auth.uid(), 'admin')
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();