import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuizzes, useQuizQuestions, useQuizAttempts, Quiz } from '@/hooks/useQuizzes';
import { Loader2, Clock, CheckCircle, XCircle, HelpCircle, Play, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const StudentQuizList: React.FC = () => {
  const { quizzes, isLoading } = useQuizzes();
  const { getMyAttempt } = useQuizAttempts();
  const [attempts, setAttempts] = useState<Record<string, any>>({});
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [loadingAttempts, setLoadingAttempts] = useState(true);

  useEffect(() => {
    const loadAttempts = async () => {
      setLoadingAttempts(true);
      const map: Record<string, any> = {};
      for (const quiz of quizzes) {
        const attempt = await getMyAttempt(quiz.id);
        if (attempt?.completed_at) {
          map[quiz.id] = attempt;
        }
      }
      setAttempts(map);
      setLoadingAttempts(false);
    };
    if (quizzes.length > 0) loadAttempts();
    else setLoadingAttempts(false);
  }, [quizzes]);

  if (activeQuiz) {
    return (
      <TakeQuiz
        quiz={activeQuiz}
        onComplete={() => {
          setActiveQuiz(null);
          // Reload attempts
          getMyAttempt(activeQuiz.id).then(a => {
            if (a?.completed_at) setAttempts(prev => ({ ...prev, [activeQuiz.id]: a }));
          });
        }}
        onCancel={() => setActiveQuiz(null)}
      />
    );
  }

  if (isLoading || loadingAttempts) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No quizzes available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => {
        const attempt = attempts[quiz.id];
        const completed = !!attempt;

        return (
          <Card key={quiz.id} className={completed ? 'border-success/30' : ''}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{quiz.title}</h3>
                    {completed && <Badge className="bg-success">Completed</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{quiz.subject} • {quiz.topic}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {quiz.time_limit_minutes} min
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {completed ? (
                    <div className="text-center px-4 py-2 rounded-xl bg-success/10">
                      <p className="text-2xl font-bold text-success">{attempt.score}</p>
                      <p className="text-xs text-muted-foreground">/ {attempt.total_points}</p>
                    </div>
                  ) : (
                    <Button onClick={() => setActiveQuiz(quiz)}>
                      <Play className="w-4 h-4 mr-2" /> Start Quiz
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Take Quiz Component
const TakeQuiz: React.FC<{ quiz: Quiz; onComplete: () => void; onCancel: () => void }> = ({
  quiz, onComplete, onCancel,
}) => {
  const { questions, isLoading } = useQuizQuestions(quiz.id);
  const { startAttempt, submitAttempt } = useQuizAttempts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; details: any[] } | null>(null);
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit_minutes * 60);

  // Timer
  useEffect(() => {
    if (result) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [result]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      const attempt = await startAttempt(quiz.id, totalPoints);

      const answerData = await Promise.all(questions.map(async (q) => {
        const selected = answers[q.id] || '';
        // Validate answer server-side using secure DB function
        const { data: isCorrect } = await supabase.rpc('validate_quiz_answer', {
          _question_id: q.id,
          _selected_answer: selected,
        });
        return {
          question_id: q.id,
          selected_answer: selected,
          is_correct: isCorrect === true,
        };
      }));

      const score = answerData.filter(a => a.is_correct).reduce((sum, a) => {
        const q = questions.find(q => q.id === a.question_id);
        return sum + (q?.points || 0);
      }, 0);

      await submitAttempt(attempt.id, answerData, score);

      setResult({
        score,
        total: totalPoints,
        details: answerData.map((a, i) => ({
          ...a,
          question: questions[i].question,
          options: questions[i].options,
        })),
      });

      toast.success(`Quiz completed! Score: ${score}/${totalPoints}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // Show results
  if (result) {
    const percentage = (result.score / result.total) * 100;
    return (
      <div className="space-y-6">
        <Card className="border-2 border-primary/30">
          <CardContent className="p-8 text-center">
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${percentage >= 60 ? 'text-success' : 'text-warning'}`} />
            <h2 className="text-3xl font-bold">{result.score} / {result.total}</h2>
            <p className="text-lg text-muted-foreground mt-2">
              {percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
            </p>
            <Progress value={percentage} className="mt-4 h-3" />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {result.details.map((d, i) => (
            <Card key={i} className={d.is_correct ? 'border-success/30' : 'border-destructive/30'}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {d.is_correct ? (
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">Q{i + 1}: {d.question}</p>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {d.options.map((opt: string, oi: number) => (
                        <span
                          key={oi}
                          className={`text-xs px-2 py-1 rounded ${
                            opt === d.selected_answer && d.is_correct
                              ? 'bg-success/20 text-success font-semibold'
                              : opt === d.selected_answer && !d.is_correct
                              ? 'bg-destructive/20 text-destructive'
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

        <Button onClick={onComplete} className="w-full">Back to Quizzes</Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="space-y-4">
      {/* Timer & Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <span className="font-semibold">{quiz.title}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {questions.length}
              </span>
              <Badge variant={timeLeft < 60 ? 'destructive' : 'secondary'} className="text-sm">
                <Clock className="w-3 h-3 mr-1" /> {formatTime(timeLeft)}
              </Badge>
            </div>
          </div>
          <Progress value={((currentIndex + 1) / questions.length) * 100} className="mt-3 h-2" />
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Q{currentIndex + 1}: {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, oi) => (
            <button
              key={oi}
              onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }))}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                answers[currentQuestion.id] === option
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="font-semibold mr-3">{String.fromCharCode(65 + oi)}.</span>
              {option}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(prev => prev - 1)}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          Previous
        </Button>
        {currentIndex < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="flex-1"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Submit Quiz
          </Button>
        )}
      </div>
      <Button variant="ghost" onClick={onCancel} className="w-full text-muted-foreground">
        Cancel Quiz
      </Button>
    </div>
  );
};

export default StudentQuizList;
