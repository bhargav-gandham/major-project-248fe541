-- Create notes table for faculty to share study materials
CREATE TABLE public.notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    file_url TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Everyone can view notes
CREATE POLICY "Everyone can view notes"
ON public.notes
FOR SELECT
USING (true);

-- Faculty and admin can create notes
CREATE POLICY "Faculty can create notes"
ON public.notes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'faculty') OR has_role(auth.uid(), 'admin'));

-- Faculty can update their own notes, admin can update any
CREATE POLICY "Faculty can update their notes"
ON public.notes
FOR UPDATE
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Faculty can delete their own notes, admin can delete any
CREATE POLICY "Faculty can delete their notes"
ON public.notes
FOR DELETE
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for notes files
INSERT INTO storage.buckets (id, name, public) VALUES ('notes', 'notes', true);

-- Storage policies for notes bucket
CREATE POLICY "Anyone can view notes files"
ON storage.objects FOR SELECT
USING (bucket_id = 'notes');

CREATE POLICY "Faculty can upload notes files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'notes' AND (has_role(auth.uid(), 'faculty') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Faculty can update their notes files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'notes' AND (has_role(auth.uid(), 'faculty') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Faculty can delete their notes files"
ON storage.objects FOR DELETE
USING (bucket_id = 'notes' AND (has_role(auth.uid(), 'faculty') OR has_role(auth.uid(), 'admin')));