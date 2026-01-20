import React from 'react';
import { cn } from '@/lib/utils';
import { Assignment, Priority } from '@/types';
import { calculatePriority } from '@/data/mockData';
import { Calendar, Clock, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';

interface AssignmentCardProps {
  assignment: Assignment;
  showAIPriority?: boolean;
  onSubmit?: () => void;
  onView?: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  showAIPriority = true,
  onSubmit,
  onView,
}) => {
  const priority = calculatePriority(assignment);
  const isOverdue = new Date(assignment.dueDate) < new Date();
  const dueDate = new Date(assignment.dueDate);

  const getPriorityColor = (level: Priority) => {
    switch (level) {
      case 'high': return 'bg-priority-high';
      case 'medium': return 'bg-priority-medium';
      case 'low': return 'bg-priority-low';
    }
  };

  const getStatusBadge = () => {
    switch (assignment.status) {
      case 'graded':
        return <Badge className="bg-success text-success-foreground">Graded: {assignment.score}/{assignment.maxScore}</Badge>;
      case 'submitted':
        return <Badge className="bg-accent text-accent-foreground">Submitted</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive text-destructive-foreground">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-5 shadow-card transition-all duration-300 hover:shadow-lg",
      isOverdue && assignment.status === 'pending' && "border-l-4 border-l-destructive"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-foreground">{assignment.title}</h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-muted-foreground">{assignment.subject}</p>
        </div>
        
        {showAIPriority && assignment.status === 'pending' && (
          <div className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5",
            getPriorityColor(priority.level)
          )}>
            {priority.level === 'high' && <AlertTriangle className="w-3.5 h-3.5" />}
            {priority.level.toUpperCase()}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {assignment.description}
      </p>

      {/* AI Recommendation */}
      {showAIPriority && assignment.status === 'pending' && (
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-accent font-semibold">🤖 AI Insight:</span>
            <span className="text-muted-foreground">{priority.reason}</span>
          </div>
        </div>
      )}

      {/* Feedback for graded */}
      {assignment.status === 'graded' && assignment.feedback && (
        <div className="bg-success/10 rounded-lg p-3 mb-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Feedback:</span> {assignment.feedback}
          </p>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <User className="w-4 h-4" />
          {assignment.facultyName}
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {format(dueDate, 'MMM dd, yyyy')}
        </div>
        <div className={cn(
          "flex items-center gap-1.5",
          isOverdue && assignment.status === 'pending' && "text-destructive font-medium"
        )}>
          <Clock className="w-4 h-4" />
          {isOverdue ? 'Overdue' : formatDistanceToNow(dueDate, { addSuffix: true })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {assignment.status === 'pending' && (
          <Button variant="hero" size="sm" onClick={onSubmit}>
            Submit Assignment
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onView}>
          View Details
        </Button>
      </div>
    </div>
  );
};

export default AssignmentCard;
