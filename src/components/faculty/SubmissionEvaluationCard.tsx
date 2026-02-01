import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  CheckCircle,
  XCircle,
  RefreshCw,
  ThumbsUp,
  AlertTriangle,
  Loader2,
  FileCheck,
  Target,
} from 'lucide-react';
import { useSubmissionEvaluation, SubmissionEvaluation } from '@/hooks/useSubmissionEvaluation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SubmissionEvaluationCardProps {
  submissionId: string;
  maxScore: number;
  onScoreSuggested?: (score: number) => void;
}

const SubmissionEvaluationCard: React.FC<SubmissionEvaluationCardProps> = ({
  submissionId,
  maxScore,
  onScoreSuggested,
}) => {
  const { evaluateSubmission, fetchEvaluation, isEvaluating, error } = useSubmissionEvaluation();
  const [evaluation, setEvaluation] = useState<SubmissionEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvaluation = async () => {
      setIsLoading(true);
      const data = await fetchEvaluation(submissionId);
      setEvaluation(data);
      setIsLoading(false);
    };
    loadEvaluation();
  }, [submissionId, fetchEvaluation]);

  const handleEvaluate = async () => {
    const result = await evaluateSubmission(submissionId);
    if (result) {
      setEvaluation(result);
      toast.success('AI evaluation completed!');
      if (result.suggested_score !== null && onScoreSuggested) {
        onScoreSuggested(result.suggested_score);
      }
    } else if (error) {
      toast.error(error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success/10';
    if (score >= 60) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!evaluation) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-5 h-5 text-accent" />
            AI Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use AI to evaluate if the submission follows instructions and answers are correct.
          </p>
          <Button
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="w-full"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Run AI Evaluation
              </>
            )}
          </Button>
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-5 h-5 text-accent" />
            AI Evaluation
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEvaluate}
            disabled={isEvaluating}
            title="Re-evaluate"
          >
            {isEvaluating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Status */}
        <div className={cn(
          "p-3 rounded-lg flex items-center gap-3",
          evaluation.follows_instructions ? "bg-success/10" : "bg-destructive/10"
        )}>
          {evaluation.follows_instructions ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <XCircle className="w-5 h-5 text-destructive" />
          )}
          <span className={cn(
            "font-medium",
            evaluation.follows_instructions ? "text-success" : "text-destructive"
          )}>
            {evaluation.follows_instructions
              ? "Follows Assignment Instructions"
              : "Does Not Follow Instructions"}
          </span>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn("p-3 rounded-lg", getScoreBgColor(evaluation.instruction_score))}>
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="w-4 h-4" />
              <span className="text-xs font-medium">Instructions</span>
            </div>
            <p className={cn("text-2xl font-bold", getScoreColor(evaluation.instruction_score))}>
              {evaluation.instruction_score}%
            </p>
            <Progress value={evaluation.instruction_score} className="h-1 mt-1" />
          </div>
          <div className={cn("p-3 rounded-lg", getScoreBgColor(evaluation.answer_correctness))}>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Correctness</span>
            </div>
            <p className={cn("text-2xl font-bold", getScoreColor(evaluation.answer_correctness))}>
              {evaluation.answer_correctness}%
            </p>
            <Progress value={evaluation.answer_correctness} className="h-1 mt-1" />
          </div>
        </div>

        {/* Suggested Score */}
        {evaluation.suggested_score !== null && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Suggested Score</span>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {evaluation.suggested_score} / {maxScore}
              </Badge>
            </div>
            {onScoreSuggested && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => onScoreSuggested(evaluation.suggested_score!)}
              >
                Apply Suggested Score
              </Button>
            )}
          </div>
        )}

        {/* Strengths */}
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-success" />
              Strengths
            </h4>
            <ul className="space-y-1">
              {evaluation.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-success mt-1 shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {evaluation.improvements && evaluation.improvements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Areas for Improvement
            </h4>
            <ul className="space-y-1">
              {evaluation.improvements.map((improvement, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-warning mt-1 shrink-0" />
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Feedback */}
        {evaluation.detailed_feedback && (
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-sm font-medium">Detailed Feedback</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {evaluation.detailed_feedback}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Evaluated at {new Date(evaluation.evaluated_at).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
};

export default SubmissionEvaluationCard;
