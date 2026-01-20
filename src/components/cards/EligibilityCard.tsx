import React from 'react';
import { cn } from '@/lib/utils';
import { ExamEligibility } from '@/types';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface EligibilityCardProps {
  eligibility: ExamEligibility;
}

const EligibilityCard: React.FC<EligibilityCardProps> = ({ eligibility }) => {
  const { isEligible, percentage, completedAssignments, totalAssignments, subjectName } = eligibility;

  return (
    <div className={cn(
      "bg-card rounded-xl border p-5 shadow-card transition-all duration-300 hover:shadow-lg",
      isEligible ? "border-success/30" : "border-destructive/30"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-foreground">{subjectName}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {completedAssignments} of {totalAssignments} assignments completed
          </p>
        </div>
        <div className={cn(
          "p-2 rounded-full",
          isEligible ? "bg-success/10" : "bg-destructive/10"
        )}>
          {isEligible ? (
            <CheckCircle2 className="w-6 h-6 text-success" />
          ) : (
            <XCircle className="w-6 h-6 text-destructive" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Completion Rate</span>
          <span className={cn(
            "font-semibold",
            isEligible ? "text-success" : "text-destructive"
          )}>
            {percentage}%
          </span>
        </div>
        <Progress 
          value={percentage} 
          className={cn(
            "h-2",
            isEligible ? "[&>div]:bg-success" : "[&>div]:bg-destructive"
          )}
        />
      </div>

      <div className={cn(
        "mt-4 p-3 rounded-lg flex items-center gap-2",
        isEligible ? "bg-success/10" : "bg-destructive/10"
      )}>
        {isEligible ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">Eligible for Exam</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              Complete {Math.ceil(totalAssignments * 0.75) - completedAssignments} more assignment(s)
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default EligibilityCard;
