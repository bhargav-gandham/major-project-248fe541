import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, Sparkles, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuizzes } from '@/hooks/useQuizzes';

interface GeneratedQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  points: number;
  selected: boolean;
}

interface GenerateQuizFormProps {
  onCreated?: () => void;
}

const GenerateQuizForm: React.FC<GenerateQuizFormProps> = ({ onCreated }) => {
  const { createQuiz } = useQuizzes();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState('10');
  const [timeLimit, setTimeLimit] = useState('15');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);

  const handleGenerate = async () => {
    if (!topic || !subject) {
      toast.error('Please enter a topic and subject');
      return;
    }

    setIsGenerating(true);
    setGeneratedQuestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { topic, subject, numberOfQuestions: parseInt(numberOfQuestions) },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const questions = (data.questions || []).map((q: any) => ({
        ...q,
        selected: true,
      }));

      if (questions.length === 0) {
        toast.error('No questions were generated. Try a different topic.');
        return;
      }

      setGeneratedQuestions(questions);
      toast.success(`Generated ${questions.length} questions!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setGeneratedQuestions(prev =>
      prev.map((q, i) => (i === index ? { ...q, selected: !q.selected } : q))
    );
  };

  const handleSaveQuiz = async () => {
    const selected = generatedQuestions.filter(q => q.selected);
    if (selected.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    setIsSaving(true);
    try {
      await createQuiz(
        {
          title: `${subject} - ${topic}`,
          topic,
          subject,
          description: `Auto-generated quiz on ${topic}`,
          time_limit_minutes: parseInt(timeLimit) || 15,
        },
        selected.map(q => ({
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points || 1,
        }))
      );

      toast.success('Quiz created successfully! You can publish it when ready.');
      setGeneratedQuestions([]);
      setTopic('');
      setSubject('');
      onCreated?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save quiz');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Quiz Generator
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="w-3 h-3 mr-1" /> AI Powered
          </Badge>
        </CardTitle>
        <CardDescription>
          Enter a topic and let AI generate quiz questions automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              placeholder="e.g., Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input
              placeholder="e.g., Quadratic Equations"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Questions</Label>
            <Input
              type="number"
              min="3"
              max="20"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Time Limit (min)</Label>
            <Input
              type="number"
              min="5"
              max="120"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Questions...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Generate Quiz
            </>
          )}
        </Button>

        {generatedQuestions.length > 0 && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                Generated Questions ({generatedQuestions.filter(q => q.selected).length} selected)
              </h4>
              <Button onClick={handleSaveQuiz} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Quiz
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {generatedQuestions.map((q, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all ${
                    q.selected ? 'border-primary/50 bg-card' : 'opacity-50 border-dashed'
                  }`}
                  onClick={() => toggleQuestion(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        q.selected ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}>
                        {q.selected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Q{index + 1}: {q.question}</p>
                        <div className="grid grid-cols-2 gap-1 mt-2">
                          {q.options.map((opt, oi) => (
                            <span
                              key={oi}
                              className={`text-xs px-2 py-1 rounded ${
                                opt === q.correct_answer
                                  ? 'bg-success/20 text-success font-semibold'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {String.fromCharCode(65 + oi)}) {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GenerateQuizForm;
