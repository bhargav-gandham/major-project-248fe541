import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { PlagiarismReport } from '@/hooks/usePlagiarismCheck';

interface PlagiarismReportCardProps {
  report: PlagiarismReport;
  compact?: boolean;
}

export const PlagiarismReportCard = ({ report, compact = false }: PlagiarismReportCardProps) => {
  const getSeverityColor = (percentage: number) => {
    if (percentage < 20) return 'text-success';
    if (percentage < 40) return 'text-warning';
    return 'text-destructive';
  };

  const getSeverityBg = (percentage: number) => {
    if (percentage < 20) return 'bg-success/10';
    if (percentage < 40) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 20) return 'bg-success';
    if (percentage < 40) return 'bg-warning';
    return 'bg-destructive';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg ${getSeverityBg(report.similarity_percentage)}`}>
        {report.is_flagged ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <Shield className="h-4 w-4 text-success" />
        )}
        <span className={`text-sm font-medium ${getSeverityColor(report.similarity_percentage)}`}>
          {report.similarity_percentage}% similarity
        </span>
        {report.is_flagged && (
          <Badge variant="destructive" className="text-xs">Flagged</Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={`border-l-4 ${report.is_flagged ? 'border-l-destructive' : 'border-l-success'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Academic Integrity Report
          </CardTitle>
          {report.is_flagged ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Flagged
            </Badge>
          ) : (
            <Badge className="bg-success flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Clear
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Similarity Score</span>
            <span className={`text-2xl font-bold ${getSeverityColor(report.similarity_percentage)}`}>
              {report.similarity_percentage}%
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full transition-all ${getProgressColor(report.similarity_percentage)}`}
              style={{ width: `${report.similarity_percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Original</span>
            <span>High Similarity</span>
          </div>
        </div>

        {report.matched_submissions && report.matched_submissions.length > 0 && (
          <div>
            <span className="text-sm font-medium">Matched with:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {report.matched_submissions.map((match, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  Submission {match}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {report.analysis_details && (
          <div>
            <span className="text-sm font-medium">Analysis Details</span>
            <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
              {report.analysis_details}
            </p>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Analyzed {format(new Date(report.analyzed_at), 'MMM d, yyyy h:mm a')}
        </div>
      </CardContent>
    </Card>
  );
};
