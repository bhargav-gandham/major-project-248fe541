import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, Sparkles, Calendar, Check, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAssignments } from '@/hooks/useAssignments';

interface GeneratedAssignment {
  title: string;
  description: string;
  max_score: number;
  selected: boolean;
  dueDate: string;
}

interface GenerateAssignmentsFormProps {
  onCreated?: () => void;
}

const GenerateAssignmentsForm: React.FC<GenerateAssignmentsFormProps> = ({ onCreated }) => {
  const { createAssignment } = useAssignments();
  const [syllabus, setSyllabus] = useState('');
  const [subject, setSubject] = useState('');
  const [numberOfAssignments, setNumberOfAssignments] = useState('5');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedAssignments, setGeneratedAssignments] = useState<GeneratedAssignment[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }

    try {
      const text = await file.text();
      setSyllabus(text);
      toast.success(`Loaded: ${file.name}`);
    } catch {
      toast.error('Could not read file. Please paste the syllabus manually.');
    }
  };

  const handleGenerate = async () => {
    if (!syllabus.trim() || !subject.trim()) {
      toast.error('Please enter the subject and syllabus content');
      return;
    }

    setIsGenerating(true);
    setGeneratedAssignments([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-assignments', {
        body: {
          syllabus: syllabus.trim(),
          subject: subject.trim(),
          numberOfAssignments: parseInt(numberOfAssignments),
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const assignments = (data.assignments || []).map((a: any) => ({
        ...a,
        selected: true,
        dueDate: '',
      }));

      if (assignments.length === 0) {
        toast.error('No assignments were generated. Try with more detailed syllabus.');
        return;
      }

      setGeneratedAssignments(assignments);
      toast.success(`${assignments.length} assignments generated! Review and set due dates before saving.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate assignments');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAssignment = (index: number) => {
    setGeneratedAssignments(prev =>
      prev.map((a, i) => (i === index ? { ...a, selected: !a.selected } : a))
    );
  };

  const updateDueDate = (index: number, date: string) => {
    setGeneratedAssignments(prev =>
      prev.map((a, i) => (i === index ? { ...a, dueDate: date } : a))
    );
  };

  const handleSaveSelected = async () => {
    const selected = generatedAssignments.filter(a => a.selected);

    if (selected.length === 0) {
      toast.error('Please select at least one assignment');
      return;
    }

    const missingDates = selected.some(a => !a.dueDate);
    if (missingDates) {
      toast.error('Please set due dates for all selected assignments');
      return;
    }

    setIsSaving(true);
    try {
      for (const a of selected) {
        await createAssignment({
          title: a.title,
          description: a.description,
          subject,
          due_date: new Date(a.dueDate).toISOString(),
          max_score: a.max_score,
        });
      }

      toast.success(`${selected.length} assignments created successfully!`);
      setGeneratedAssignments([]);
      setSyllabus('');
      setSubject('');
      onCreated?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save assignments');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Assignment Generator
        </CardTitle>
        <CardDescription>
          Upload or paste your syllabus and AI will generate assignments automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        {generatedAssignments.length === 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ai-subject">Subject</Label>
                <Input
                  id="ai-subject"
                  placeholder="e.g., Mathematics, Physics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-count">Number of Assignments</Label>
                <Select value={numberOfAssignments} onValueChange={setNumberOfAssignments}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 10].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} assignments</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-syllabus">Syllabus Content</Label>
              <div className="flex items-center gap-2 mb-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm hover:bg-muted transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload File (.txt)
                  <input
                    type="file"
                    accept=".txt,.text"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-muted-foreground">or paste below</span>
              </div>
              <Textarea
                id="ai-syllabus"
                placeholder="Paste your syllabus content here... Include topics, chapters, learning objectives, etc."
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                rows={8}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !syllabus.trim() || !subject.trim()}
              className="w-full md:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Assignments...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Assignments
                </>
              )}
            </Button>
          </>
        )}

        {/* Generated Assignments Review */}
        {generatedAssignments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {generatedAssignments.filter(a => a.selected).length} / {generatedAssignments.length} selected
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGeneratedAssignments([])}
              >
                Start Over
              </Button>
            </div>

            <div className="space-y-3">
              {generatedAssignments.map((assignment, index) => (
                <Card
                  key={index}
                  className={`transition-all ${assignment.selected ? 'border-primary/40 bg-primary/5' : 'opacity-60'}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleAssignment(index)}
                        className={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          assignment.selected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {assignment.selected && <Check className="w-4 h-4" />}
                      </button>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{assignment.title}</h4>
                          <Badge variant="outline">Max: {assignment.max_score}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{assignment.description}</p>

                        {assignment.selected && (
                          <div className="flex items-center gap-2 pt-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="datetime-local"
                              value={assignment.dueDate}
                              onChange={(e) => updateDueDate(index, e.target.value)}
                              className="max-w-xs h-8 text-sm"
                              placeholder="Set due date"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleSaveSelected}
              disabled={isSaving}
              className="w-full md:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save {generatedAssignments.filter(a => a.selected).length} Assignments
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GenerateAssignmentsForm;
