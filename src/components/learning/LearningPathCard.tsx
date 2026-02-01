import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  BookOpen,
  Video,
  FileText,
  PenTool,
  Lightbulb,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
} from 'lucide-react';
import { useLearningPath, LearningRecommendation, PerformanceGap } from '@/hooks/useLearningPath';
import { cn } from '@/lib/utils';

const getTypeIcon = (type: LearningRecommendation['type']) => {
  switch (type) {
    case 'video':
      return <Video className="w-4 h-4" />;
    case 'practice':
      return <PenTool className="w-4 h-4" />;
    case 'reading':
      return <BookOpen className="w-4 h-4" />;
    case 'tutorial':
      return <Lightbulb className="w-4 h-4" />;
    case 'exercise':
      return <FileText className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'medium':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'low':
      return 'bg-success/10 text-success border-success/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'text-destructive';
    case 'medium':
      return 'text-warning';
    case 'low':
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';
  }
};

const LearningPathCard: React.FC = () => {
  const { data, isLoading, error, fetchLearningPath } = useLearningPath();

  React.useEffect(() => {
    fetchLearningPath();
  }, [fetchLearningPath]);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-accent" />
            Personalized Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <p className="text-sm text-muted-foreground">Analyzing your performance...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-accent" />
            Personalized Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchLearningPath}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || (data.recommendations?.length === 0 && !data.message)) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-accent" />
            Personalized Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <Target className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {data?.message || "Complete some assignments to get personalized recommendations!"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-accent" />
            Personalized Learning Path
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchLearningPath} title="Refresh recommendations">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        {data.encouragement && (
          <p className="text-sm text-muted-foreground mt-2">{data.encouragement}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Gaps Section */}
        {data.performanceGaps && data.performanceGaps.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Areas for Improvement
            </h4>
            <div className="space-y-2">
              {data.performanceGaps.map((gap, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <AlertTriangle className={cn("w-4 h-4 mt-0.5 shrink-0", getSeverityColor(gap.severity))} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{gap.subject}</span>
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(gap.severity))}>
                        {gap.severity} priority
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{gap.issue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Recommended Resources
            </h4>
            <div className="space-y-2">
              {data.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      rec.type === 'video' && "bg-accent/10 text-accent",
                      rec.type === 'practice' && "bg-primary/10 text-primary",
                      rec.type === 'reading' && "bg-success/10 text-success",
                      rec.type === 'tutorial' && "bg-warning/10 text-warning",
                      rec.type === 'exercise' && "bg-destructive/10 text-destructive"
                    )}>
                      {getTypeIcon(rec.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{rec.title}</span>
                        <Badge variant="outline" className={cn("text-xs", getPriorityColor(rec.priority))}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {rec.subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rec.estimatedTime}
                        </span>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {rec.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        {data.performanceSummary && data.performanceSummary.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground">Your Performance Summary</h4>
            <div className="grid gap-2">
              {data.performanceSummary.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 truncate">{item.subject}</span>
                  <div className="flex-1">
                    <Progress 
                      value={item.assignmentAverage || 0} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-xs font-medium w-12 text-right">
                    {item.assignmentAverage !== null ? `${item.assignmentAverage}%` : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningPathCard;
