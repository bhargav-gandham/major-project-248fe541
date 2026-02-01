import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Loader2, Upload, FileText, AlertCircle, CheckCircle, Keyboard, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSubmissions, Assignment } from '@/hooks/useAssignments';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';

interface SubmitAssignmentFormProps {
  assignment: Assignment;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

const SubmitAssignmentForm: React.FC<SubmitAssignmentFormProps> = ({ 
  assignment, 
  onSubmitted,
  onCancel 
}) => {
  const { submitAssignment, fetchMySubmission, mySubmission } = useSubmissions();
  const [typedContent, setTypedContent] = useState('');
  const [inputMode, setInputMode] = useState<'type' | 'voice'>('type');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLate = new Date() > new Date(assignment.due_date);

  useEffect(() => {
    const checkExisting = async () => {
      const existing = await fetchMySubmission(assignment.id);
      setExistingSubmission(existing);
    };
    checkExisting();
  }, [assignment.id]);

  // Block paste functionality
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast.error('Pasting is not allowed. Please type your answer manually.');
  };

  // Block drag and drop text
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    toast.error('Drag and drop is not allowed. Please type your answer manually.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Limit file size to 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!typedContent.trim() && !file) {
      toast.error('Please type your answer or upload a file');
      return;
    }

    setIsLoading(true);

    try {
      let fileUrl: string | undefined;

      // Upload file if present
      if (file) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        const fileExt = file.name.split('.').pop();
        const fileName = `${userData.user.id}/${assignment.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('submissions')
          .getPublicUrl(fileName);

        fileUrl = urlData.publicUrl;
      }

      await submitAssignment(assignment.id, typedContent, fileUrl, isLate);

      toast.success('Assignment submitted successfully!');
      onSubmitted?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit assignment');
    } finally {
      setIsLoading(false);
    }
  };

  if (existingSubmission) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-success">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="font-medium">Already Submitted</p>
              <p className="text-sm text-muted-foreground">
                You submitted this assignment on {new Date(existingSubmission.submitted_at).toLocaleString()}
              </p>
              {existingSubmission.score !== null && (
                <p className="text-sm font-medium mt-1">
                  Score: {existingSubmission.score}/{assignment.max_score}
                </p>
              )}
            </div>
          </div>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="mt-4">
              Back to Assignments
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Submit: {assignment.title}
        </CardTitle>
        <CardDescription>
          {assignment.subject} • Due: {new Date(assignment.due_date).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLate && (
          <Alert className="mb-4 border-warning bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              This assignment is past due. Late submission may result in reduced marks.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Assignment Description</h4>
          <p className="text-sm text-muted-foreground">{assignment.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Your Answer</Label>
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'type' | 'voice')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="type" className="gap-2">
                  <Keyboard className="h-4 w-4" />
                  Type Answer
                </TabsTrigger>
                <TabsTrigger value="voice" className="gap-2">
                  <Mic className="h-4 w-4" />
                  Voice Dictation
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="type" className="mt-0">
                <textarea
                  ref={textareaRef}
                  id="answer"
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  placeholder="Type your answer here. Pasting is disabled to ensure original work..."
                  value={typedContent}
                  onChange={(e) => setTypedContent(e.target.value)}
                  onPaste={handlePaste}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Characters typed: {typedContent.length}
                </p>
              </TabsContent>
              
              <TabsContent value="voice" className="mt-0">
                <VoiceRecorder
                  onTranscriptChange={setTypedContent}
                  initialTranscript={typedContent}
                  placeholder="Click the microphone button and start speaking your answer..."
                />
                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Preview of your answer:</strong>
                  </p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {typedContent || <span className="text-muted-foreground italic">No content yet...</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Characters: {typedContent.length}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload Supporting File (Optional)</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : 'Choose file'}
                </span>
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
              </label>
              {file && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Max file size: 10MB. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Assignment
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SubmitAssignmentForm;
